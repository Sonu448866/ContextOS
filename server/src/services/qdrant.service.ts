import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { EmbeddingService } from './embedding.service';
import { KnowledgeSource } from '../models/KnowledgeSource';

export interface QdrantSearchResult {
  score: number; // percentage (0 - 100)
  rawScore: number;
  chunkId: string | number;
  text: string;
  sourceTitle: string;
  sourceId: string;
  sourceType: string;
  author?: string;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface QdrantHealthStatus {
  connected: boolean;
  collectionExists: boolean;
  pointsCount: number;
  vectorDimension: number;
  collectionName: string;
  qdrantUrl: string;
  error?: string;
}

interface InMemoryPoint {
  id: string;
  vector: number[];
  payload: any;
}

export class QdrantService {
  private static readonly url = (
    env.QDRANT_URL || process.env.QDRANT_URL || ''
  ).replace(/\/$/, '');
  private static readonly apiKey = env.QDRANT_API_KEY || process.env.QDRANT_API_KEY || '';
  private static readonly collectionName = env.QDRANT_COLLECTION || 'knowledge';
  private static readonly dimension = env.EMBEDDING_DIMENSION || 384;

  // In-memory mirror for local fallback if remote cluster is temporarily unreachable
  private static inMemoryStore: Map<string, InMemoryPoint> = new Map();

  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }
    return headers;
  }

  /**
   * Checks connectivity and status of the Qdrant cluster & collection.
   */
  public static async checkHealth(): Promise<QdrantHealthStatus> {
    const defaultStatus: QdrantHealthStatus = {
      connected: false,
      collectionExists: false,
      pointsCount: this.inMemoryStore.size,
      vectorDimension: this.dimension,
      collectionName: this.collectionName,
      qdrantUrl: this.url || 'In-Memory Vector Store'
    };

    if (!this.url) {
      return {
        ...defaultStatus,
        connected: true,
        collectionExists: true,
        pointsCount: this.inMemoryStore.size
      };
    }

    try {
      const response = await fetch(`${this.url}/collections/${this.collectionName}`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data: any = await response.json();
        const result = data?.result;
        return {
          connected: true,
          collectionExists: true,
          pointsCount: result?.points_count || 0,
          vectorDimension: result?.config?.params?.vectors?.size || this.dimension,
          collectionName: this.collectionName,
          qdrantUrl: this.url
        };
      }

      if (response.status === 404) {
        return {
          ...defaultStatus,
          connected: true,
          collectionExists: false,
          error: `Collection "${this.collectionName}" not found.`
        };
      }

      return {
        ...defaultStatus,
        error: `Qdrant HTTP ${response.status}: ${await response.text()}`
      };
    } catch (err: any) {
      logger.warn({ err: err?.message, url: this.url }, 'Qdrant health check failed, fallback active');
      return {
        ...defaultStatus,
        error: err?.message || 'Cluster connection timed out'
      };
    }
  }

  /**
   * Ensures the collection exists in Qdrant with Cosine distance.
   */
  public static async ensureCollection(dimension = this.dimension): Promise<boolean> {
    if (!this.url) return true;

    try {
      const checkRes = await fetch(`${this.url}/collections/${this.collectionName}`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000)
      });

      if (checkRes.ok) {
        // Ensure projectId payload index exists
        await this.ensurePayloadIndex('projectId');
        return true;
      }

      // Create collection if missing
      const createRes = await fetch(`${this.url}/collections/${this.collectionName}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          vectors: {
            size: dimension,
            distance: 'Cosine'
          }
        })
      });

      if (createRes.ok) {
        logger.info({ collection: this.collectionName, dimension }, 'Created Qdrant vector collection');
        await this.ensurePayloadIndex('projectId');
        return true;
      }

      const errText = await createRes.text();
      logger.error({ status: createRes.status, err: errText }, 'Failed to create Qdrant collection');
      return false;
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Error ensuring Qdrant collection');
      return false;
    }
  }

  /**
   * Ensures a payload field is indexed in Qdrant (required for strict mode filtering).
   */
  public static async ensurePayloadIndex(fieldName: string): Promise<void> {
    if (!this.url) return;
    try {
      await fetch(`${this.url}/collections/${this.collectionName}/index`, {
        method: 'PUT',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          field_name: fieldName,
          field_schema: 'keyword'
        })
      });
    } catch {
      // Ignore if already indexed
    }
  }

  /**
   * Splits arbitrary text into semantic chunks with overlapping context.
   */
  public static chunkText(text: string, maxChunkLength = 500, overlap = 80): string[] {
    if (!text || text.trim().length === 0) return [];

    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length <= maxChunkLength) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        // If single paragraph is larger than maxChunkLength, split by sentences
        if (para.length > maxChunkLength) {
          const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) || [para];
          let sentenceChunk = '';
          for (const s of sentences) {
            if ((sentenceChunk + s).length <= maxChunkLength) {
              sentenceChunk += s;
            } else {
              if (sentenceChunk) chunks.push(sentenceChunk.trim());
              sentenceChunk = s;
            }
          }
          if (sentenceChunk) chunks.push(sentenceChunk.trim());
          currentChunk = '';
        } else {
          currentChunk = para;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    // If text was short and single chunk
    if (chunks.length === 0 && text.trim().length > 0) {
      chunks.push(text.trim());
    }

    return chunks;
  }

  /**
   * Chunks, embeds, and upserts a KnowledgeSource into Qdrant.
   */
  public static async upsertSourceChunks(params: {
    projectId: string;
    sourceId: string;
    title: string;
    sourceType: string;
    author?: string;
    tags?: string[];
    text: string;
  }): Promise<{ chunkCount: number }> {
    const chunks = this.chunkText(params.text);
    if (chunks.length === 0) {
      return { chunkCount: 0 };
    }

    logger.info(
      { sourceId: params.sourceId, title: params.title, chunkCount: chunks.length },
      'Vectorizing knowledge source into Qdrant'
    );

    const embeddings = await EmbeddingService.batchGenerateEmbeddings(chunks);
    const points: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const pointId = uuidv4();
      const point = {
        id: pointId,
        vector: embeddings[i],
        payload: {
          projectId: params.projectId,
          sourceId: params.sourceId,
          sourceTitle: params.title,
          sourceType: params.sourceType,
          author: params.author || 'Team Member',
          tags: params.tags || [],
          chunkIndex: i + 1,
          totalChunks: chunks.length,
          text: chunks[i],
          createdAt: new Date().toISOString()
        }
      };

      points.push(point);

      // Save to in-memory mirror
      this.inMemoryStore.set(pointId, point);
    }

    // Upsert to remote Qdrant if configured
    if (this.url) {
      try {
        const response = await fetch(`${this.url}/collections/${this.collectionName}/points?wait=true`, {
          method: 'PUT',
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({ points })
        });

        if (response.ok) {
          logger.info({ collection: this.collectionName, pointsCount: points.length }, 'Successfully upserted points to Qdrant Cloud');
        } else {
          const errText = await response.text();
          logger.warn({ status: response.status, err: errText.substring(0, 200) }, 'Failed to upsert points to Qdrant Cloud, saved in local mirror');
        }
      } catch (err: any) {
        logger.warn({ err: err?.message }, 'Network error upserting to Qdrant Cloud, local mirror updated');
      }
    }

    return { chunkCount: chunks.length };
  }

  /**
   * Performs semantic vector search on Qdrant.
   * Matches question against vector chunks, ranking by Cosine Similarity.
   */
  public static async search(params: {
    query: string;
    projectId?: string;
    limit?: number;
  }): Promise<QdrantSearchResult[]> {
    const limit = params.limit || 5;
    const queryVector = await EmbeddingService.generateEmbedding(params.query);

    // 1. Try remote Qdrant Cloud search
    if (this.url) {
      try {
        const body: any = {
          vector: queryVector,
          limit,
          with_payload: true
        };

        if (params.projectId) {
          body.filter = {
            must: [
              {
                key: 'projectId',
                match: { value: params.projectId }
              }
            ]
          };
        }

        const response = await fetch(`${this.url}/collections/${this.collectionName}/points/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const data: any = await response.json();
          const results: any[] = data?.result || [];

          // If project filter returned 0 results, retry without filter to catch general knowledge
          let finalResults = results;
          if (finalResults.length === 0 && params.projectId) {
            delete body.filter;
            const fallbackRes = await fetch(`${this.url}/collections/${this.collectionName}/points/search`, {
              method: 'POST',
              headers: this.getHeaders(),
              signal: AbortSignal.timeout(5000),
              body: JSON.stringify(body)
            });
            if (fallbackRes.ok) {
              const fallbackData: any = await fallbackRes.json();
              finalResults = fallbackData?.result || [];
            }
          }

          if (finalResults.length > 0) {
            return finalResults.map((item) => {
              const score = Math.max(0, Math.min(100, Math.round(((item.score + 1) / 2) * 100)));
              return {
                score,
                rawScore: item.score,
                chunkId: item.id,
                text: item.payload?.text || '',
                sourceTitle: item.payload?.sourceTitle || item.payload?.title || 'Knowledge Record',
                sourceId: item.payload?.sourceId || String(item.id),
                sourceType: item.payload?.sourceType || 'Document',
                author: item.payload?.author,
                chunkIndex: item.payload?.chunkIndex,
                totalChunks: item.payload?.totalChunks
              };
            });
          }
        }
      } catch (err: any) {
        logger.warn({ err: err?.message }, 'Remote Qdrant search failed, evaluating in-memory vector mirror');
      }
    }

    // 2. In-Memory Cosine Similarity search fallback
    return this.searchInMemory(queryVector, params.projectId, limit);
  }

  /**
   * Fallback in-memory cosine similarity computation.
   */
  private static searchInMemory(
    queryVector: number[],
    projectId?: string,
    limit = 5
  ): QdrantSearchResult[] {
    const scored: Array<{ point: InMemoryPoint; score: number }> = [];

    for (const point of this.inMemoryStore.values()) {
      if (projectId && point.payload?.projectId && point.payload.projectId !== projectId) {
        continue;
      }

      let dotProduct = 0;
      for (let i = 0; i < queryVector.length; i++) {
        dotProduct += (queryVector[i] || 0) * (point.vector[i] || 0);
      }

      scored.push({ point, score: dotProduct });
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ point, score }) => {
      const percentage = Math.max(0, Math.min(100, Math.round(((score + 1) / 2) * 100)));
      return {
        score: percentage,
        rawScore: score,
        chunkId: point.id,
        text: point.payload?.text || '',
        sourceTitle: point.payload?.sourceTitle || point.payload?.title || 'Knowledge Record',
        sourceId: point.payload?.sourceId || point.id,
        sourceType: point.payload?.sourceType || 'Document',
        author: point.payload?.author,
        chunkIndex: point.payload?.chunkIndex,
        totalChunks: point.payload?.totalChunks
      };
    });
  }

  /**
   * Synchronizes all stored MongoDB knowledge sources into Qdrant vector database.
   */
  public static async syncAllKnowledge(projectId?: string): Promise<{
    totalSources: number;
    totalChunksIndexed: number;
  }> {
    await this.ensureCollection();

    const query: any = {};
    if (projectId) {
      query.projectId = projectId;
    }

    const sources = await KnowledgeSource.find(query).lean();
    let totalChunksIndexed = 0;

    for (const source of sources) {
      const res = await this.upsertSourceChunks({
        projectId: source.projectId.toString(),
        sourceId: (source as any)._id.toString(),
        title: source.title,
        sourceType: source.sourceType,
        author: source.author || undefined,
        tags: source.tags,
        text: source.originalText
      });
      totalChunksIndexed += res.chunkCount;
    }

    logger.info({ totalSources: sources.length, totalChunksIndexed }, 'Completed full Qdrant RAG synchronization');

    return {
      totalSources: sources.length,
      totalChunksIndexed
    };
  }
}
