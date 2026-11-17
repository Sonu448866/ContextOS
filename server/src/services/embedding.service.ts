import { env } from '../config/env';
import { logger } from '../config/logger';

export class EmbeddingService {
  private static readonly DIMENSION = env.EMBEDDING_DIMENSION || 384;

  /**
   * Generates a 384-dimensional vector embedding for a given text.
   * Uses Google Gemini's gemini-embedding-001 with outputDimensionality: 384.
   * Falls back to a deterministic normalized float vector if API key is absent or network fails.
   */
  public static async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = env.GEMINI_API_KEY || env.AI_API_KEY;

    if (!text || text.trim().length === 0) {
      return new Array(this.DIMENSION).fill(0);
    }

    if (apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            model: `models/${env.EMBEDDING_MODEL}`,
            content: {
              parts: [{ text: text.substring(0, 2048) }]
            },
            outputDimensionality: this.DIMENSION
          })
        });

        if (response.ok) {
          const data: any = await response.json();
          const values = data?.embedding?.values;
          if (Array.isArray(values) && values.length === this.DIMENSION) {
            return values;
          }
        } else {
          const errText = await response.text();
          logger.warn({ status: response.status, err: errText.substring(0, 150) }, 'Embedding API call failed, using deterministic fallback');
        }
      } catch (err: any) {
        logger.warn({ err: err?.message }, 'Embedding generation network error, using deterministic fallback');
      }
    }

    // Deterministic normalized embedding fallback
    return this.createDeterministicEmbedding(text);
  }

  /**
   * Batch generates embeddings for multiple chunks.
   */
  public static async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const vector = await this.generateEmbedding(text);
      results.push(vector);
    }
    return results;
  }

  /**
   * Generates a mathematically valid, deterministic normalized vector for offline/testing fallback.
   * Computes character n-grams and hashes into a 384-dimensional unit vector.
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
    } else {
      vector[0] = 1.0;
    }

    return vector;
  }
}
