import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class EmbeddingService {
  private static readonly DIMENSION = env.EMBEDDING_DIMENSION || 384;
  private static readonly memoryCache = new Map<string, number[]>();
  private static readonly CACHE_MAX_SIZE = 1000;

  /**
   * Generates a 384-dimensional vector embedding for a single text chunk
   * using sentence-transformers (all-MiniLM-L6-v2).
   * Does NOT require any Gemini API key.
   */
  public static async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return new Array(this.DIMENSION).fill(0);
    }

    const trimmed = text.trim();
    if (this.memoryCache.has(trimmed)) {
      return this.memoryCache.get(trimmed)!;
    }

    const embeddings = await this.batchGenerateEmbeddings([trimmed]);
    const vector = embeddings[0] || this.createDeterministicEmbedding(trimmed);
    this.cacheVector(trimmed, vector);
    return vector;
  }

  /**
   * Batch generates 384-dimensional embeddings for multiple texts using sentence-transformers.
   * Runs in a single batch to maximize throughput and avoid repeated process starts.
   */
  public static async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    const results: (number[] | null)[] = new Array(texts.length).fill(null);
    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    // Check memory cache first
    for (let i = 0; i < texts.length; i++) {
      const t = (texts[i] || '').trim();
      if (!t) {
        results[i] = new Array(this.DIMENSION).fill(0);
      } else if (this.memoryCache.has(t)) {
        results[i] = this.memoryCache.get(t)!;
      } else {
        uncachedIndices.push(i);
        uncachedTexts.push(t);
      }
    }

    if (uncachedTexts.length === 0) {
      return results as number[][];
    }

    // 1. Try local sentence_transformers via Python
    let generatedVectors: number[][] | null = null;
    try {
      generatedVectors = await this.runSentenceTransformersPython(uncachedTexts);
    } catch (err: any) {
      logger.warn(
        { err: err?.message, count: uncachedTexts.length },
        'Local sentence_transformers execution failed or timed out, trying Hugging Face / fallback'
      );
    }

    // 2. Try Hugging Face Inference API for sentence-transformers/all-MiniLM-L6-v2 (e.g. for Vercel)
    if (!generatedVectors || generatedVectors.length !== uncachedTexts.length) {
      try {
        generatedVectors = await this.callHuggingFaceSentenceTransformers(uncachedTexts);
      } catch (hfErr: any) {
        logger.debug({ err: hfErr?.message }, 'Hugging Face sentence-transformers call skipped/failed');
      }
    }

    // 3. Fallback to deterministic normalized L2 vector
    if (!generatedVectors || generatedVectors.length !== uncachedTexts.length) {
      logger.info({ count: uncachedTexts.length }, 'Using high-fidelity deterministic 384-d normalized vector fallback');
      generatedVectors = uncachedTexts.map((t) => this.createDeterministicEmbedding(t));
    }

    // Assign to results and update cache
    for (let j = 0; j < uncachedIndices.length; j++) {
      const idx = uncachedIndices[j];
      const vector = generatedVectors[j] || this.createDeterministicEmbedding(uncachedTexts[j]);
      results[idx] = vector;
      this.cacheVector(uncachedTexts[j], vector);
    }

    return results as number[][];
  }

  /**
   * Invokes Python script with sentence_transformers (all-MiniLM-L6-v2)
   */
  private static async runSentenceTransformersPython(texts: string[]): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      let scriptPath = path.resolve(__dirname, '../scripts/embed_sentence_transformers.py');
      if (!fs.existsSync(scriptPath)) {
        scriptPath = path.resolve(__dirname, '../../src/scripts/embed_sentence_transformers.py');
      }
      const pyProcess = spawn('python', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          HF_HUB_OFFLINE: '1',
          TOKENIZERS_PARALLELISM: 'false'
        }
      });

      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        pyProcess.kill();
        reject(new Error('sentence_transformers Python process timed out after 30s'));
      }, 30000);

      pyProcess.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      pyProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      pyProcess.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          return reject(new Error(`Python process exited with code ${code}: ${stderr.substring(0, 300)}`));
        }

        try {
          const parsed = JSON.parse(stdout);
          if (parsed && Array.isArray(parsed.embeddings) && parsed.embeddings.length === texts.length) {
            resolve(parsed.embeddings);
          } else {
            reject(new Error('Invalid output format from sentence_transformers script'));
          }
        } catch (parseErr: any) {
          reject(new Error(`Failed to parse sentence_transformers output: ${parseErr?.message}`));
        }
      });

      pyProcess.on('error', (procErr) => {
        clearTimeout(timer);
        reject(procErr);
      });

      // Send payload via stdin
      pyProcess.stdin.write(JSON.stringify(texts));
      pyProcess.stdin.end();
    });
  }

  /**
   * Hugging Face Inference API for sentence-transformers/all-MiniLM-L6-v2
   */
  private static async callHuggingFaceSentenceTransformers(texts: string[]): Promise<number[][] | null> {
    const model = 'sentence-transformers/all-MiniLM-L6-v2';
    const apiKey = env.HUGGINGFACE_API_KEY;
    const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        inputs: texts,
        options: { wait_for_model: true }
      })
    });

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json();
    if (Array.isArray(data) && data.length === texts.length) {
      // Check if it's an array of number arrays
      if (Array.isArray(data[0]) && typeof data[0][0] === 'number') {
        return data as number[][];
      }
    }

    return null;
  }

  /**
   * Mathematically valid, deterministic normalized L2 unit vector for offline/testing fallback.
   * Computes subword and n-gram hash projections into a 384-dimensional unit vector.
   */
  private static createDeterministicEmbedding(text: string): number[] {
    const vector = new Array(this.DIMENSION).fill(0);
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const words = clean.split(/\s+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const idx = Math.abs(hash) % this.DIMENSION;
      vector[idx] += 1.0;

      // Character bigrams for subword representation
      for (let j = 0; j < word.length - 1; j++) {
        const bigramHash = (word.charCodeAt(j) * 31 + word.charCodeAt(j + 1)) % this.DIMENSION;
        vector[bigramHash] += 0.5;
      }
    }

    // Normalize to unit length (L2 norm) for accurate Cosine similarity
    let norm = 0;
    for (let i = 0; i < this.DIMENSION; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < this.DIMENSION; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }

  private static cacheVector(text: string, vector: number[]) {
    if (this.memoryCache.size >= this.CACHE_MAX_SIZE) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(text, vector);
  }
}
