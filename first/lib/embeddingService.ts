// /lib/embeddingService.ts

import { FeatureExtractionPipeline, pipeline } from '@xenova/transformers';

let textPipeline: FeatureExtractionPipeline | null = null;
let visionPipeline: FeatureExtractionPipeline | null = null;

const TEXT_MODEL = 'Xenova/all-MiniLM-L6-v2';
const VISION_MODEL = 'Xenova/clip-vit-base-patch32';

export async function initializeEmbedders() {
  if (!textPipeline) {
    textPipeline = await pipeline('feature-extraction', TEXT_MODEL);
  }
  if (!visionPipeline) {
    visionPipeline = await pipeline('feature-extraction', VISION_MODEL);
  }
}

export async function getTransformTextEmbedding(descriptiveText: string): Promise<number[]> {
  await initializeEmbedders();

  const output = await textPipeline!(descriptiveText, { pooling: 'mean', normalize: true });

  return Array.from(output.data);
}

export async function getTransformVisualEmbedding(base64Image: string): Promise<number[]> {
  await initializeEmbedders();

  const output = await visionPipeline!(base64Image);

  return Array.from(output.data);
}