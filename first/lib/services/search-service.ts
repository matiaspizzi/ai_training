import logger from '../logger';
import { pc } from '../pinecone';
import { getTransformTextEmbeddings, getTransformImageEmbeddings } from '../embeddings';

interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export class SearchService {
  private async queryIndex(indexName: string, vector: number[], topK: number = 10) {
    const index = pc.index(indexName);
    const result = await index.query({
      vector,
      topK,
      includeMetadata: true,
    });
    return result.matches.map(match => ({
      id: match.id,
      score: match.score || 0,
      metadata: (match.metadata || {}) as Record<string, unknown>,
    }));
  }

  async searchByText(query: string, topK: number = 10): Promise<SearchResult[]> {
    const textEmbedding = await getTransformTextEmbeddings(query);
    const textMatches = await this.queryIndex('text-index', textEmbedding as number[], topK);
    const visualMatches = await this.queryIndex('visual-index', textEmbedding as number[], topK);
    return this.mergeResults(textMatches, visualMatches);
  }

  async searchByImage(imageBase64: string, topK: number = 10): Promise<SearchResult[]> {
    const imageEmbedding = await getTransformImageEmbeddings(imageBase64);
    const visualMatches = await this.queryIndex('visual-index', imageEmbedding as number[], topK);
    return visualMatches;
  }

  private mergeResults(textMatches: SearchResult[], visualMatches: SearchResult[]): SearchResult[] {
    const combinedMap = new Map<string, SearchResult>();

    const textWeight = 0.5;
    const visualWeight = 0.5;

    for (const match of textMatches) {
      combinedMap.set(match.id, {
        id: match.id,
        score: (match.score || 0) * textWeight,
        metadata: match.metadata,
      });
    }

    for (const match of visualMatches) {
      const existing = combinedMap.get(match.id);
      if (existing) {
        existing.score += (match.score || 0) * visualWeight;
      } else {
        combinedMap.set(match.id, {
          id: match.id,
          score: (match.score || 0) * visualWeight,
          metadata: match.metadata,
        });
      }
    }

    logger.debug({ count: combinedMap.size }, 'Merged search results');

    return Array.from(combinedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
}

export const searchService = new SearchService();
