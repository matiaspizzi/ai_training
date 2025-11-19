import { type FeatureExtractionPipeline, type ImageFeatureExtractionPipeline, pipeline } from '@xenova/transformers';


const MODEL = 'Xenova/clip-vit-base-patch32';

let textEmbedder: FeatureExtractionPipeline | null = null;
let imageEmbedder: ImageFeatureExtractionPipeline | null = null;

export async function initializeEmbedders() {
  if (!textEmbedder) {
    textEmbedder = await pipeline(
      "feature-extraction",
      MODEL
    );
  }

  if (!imageEmbedder) {
    imageEmbedder = await pipeline(
      'image-feature-extraction',
      MODEL
    );
  }
}

export async function getTransformTextEmbeddings(descriptiveText: string[]): Promise<number[]> {
  try{
    await initializeEmbedders();
    if (!textEmbedder) {
      throw new Error("Pipeline not initialized.");
    }
    if (descriptiveText.length === 0) {
      return [];
    }
    const output = await textEmbedder(descriptiveText, { pooling: 'mean', normalize: true });
    console.log("Text embedding generated");
    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating text embeddings:", error);
    throw error;
  }
}

export async function getTransformImageEmbeddings(imageUrl: string): Promise<number[]> {
  try {
    await initializeEmbedders();
    if (!imageEmbedder) {
      throw new Error("Pipeline not initialized.");
    }
    const output = await imageEmbedder(imageUrl);
    console.log("Image embedding generated");
    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating image embeddings:", error);
    throw error;
  }
}