import logger from './logger';
import {
  AutoTokenizer,
  CLIPTextModelWithProjection,
  AutoProcessor,
  CLIPVisionModelWithProjection,
  Tensor,
  RawImage,
  PreTrainedTokenizer,
  Processor
} from "@xenova/transformers";

type EmbeddingResult = number[] | number[][];
type Input = string | string[];

const MODEL_NAME = 'Xenova/clip-vit-base-patch32';

let tokenizerInstance: PreTrainedTokenizer | null = null;
let textModelInstance: CLIPTextModelWithProjection | null = null;
let processorInstance: Processor | null = null;
let visionModelInstance: CLIPVisionModelWithProjection | null = null;

/////////////////////////////
// Model Loading
/////////////////////////////

async function loadModelAndResources(): Promise<void> {
  if (!tokenizerInstance || !textModelInstance || !processorInstance || !visionModelInstance) {
    tokenizerInstance = await AutoTokenizer.from_pretrained(MODEL_NAME);
    textModelInstance = await CLIPTextModelWithProjection.from_pretrained(MODEL_NAME);

    processorInstance = await AutoProcessor.from_pretrained(MODEL_NAME);
    visionModelInstance = await CLIPVisionModelWithProjection.from_pretrained(MODEL_NAME);

    logger.info("Model and resources loaded");
  }
}

/////////////////////////////
// Embedding Processing
/////////////////////////////

const processAndNormalizeEmbeddings = (embeddings: Tensor, isSingleInput: boolean): EmbeddingResult => {
  const data: Float32Array = embeddings.data as Float32Array;

  const numEmbeddings = embeddings.dims[0];
  const embeddingSize = embeddings.dims[1];
  const normalizedEmbeddings: number[][] = [];

  for (let i = 0; i < numEmbeddings; i++) {
    const start = i * embeddingSize;
    const end = start + embeddingSize;
    const vector = data.slice(start, end);
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    const normalizedVector = Array.from(vector).map((val) => val / norm);
    normalizedEmbeddings.push(normalizedVector);
  }

  return isSingleInput ? normalizedEmbeddings[0] : normalizedEmbeddings;
};


/////////////////////////////
// Text Embeddings
/////////////////////////////

export async function getTransformTextEmbeddings(descriptiveText: Input): Promise<EmbeddingResult> {
  await loadModelAndResources();

  if (!tokenizerInstance || !textModelInstance)
    throw new Error("Model or tokenizer not initialized.");

  const isSingleInput = typeof descriptiveText === 'string';
  const textToTokenize = isSingleInput ? [descriptiveText] : descriptiveText;
  const textInputs = await tokenizerInstance(textToTokenize, {
    padding: true,
    truncation: true,
    return_tensors: "pt",
  });

  const { text_embeds } = await textModelInstance(textInputs) as { text_embeds: Tensor };
  return processAndNormalizeEmbeddings(text_embeds, isSingleInput);
}


/////////////////////////////
// Image Embeddings
/////////////////////////////

export async function getTransformImageEmbeddings(imageInput: Input): Promise<EmbeddingResult> {
  await loadModelAndResources();

  if (!processorInstance || !visionModelInstance) 
    throw new Error("Model or processor not initialized.");

  const isSingleInput = typeof imageInput === 'string';
  const imagesToProcess = isSingleInput ? [await RawImage.read(imageInput)] : await Promise.all(imageInput.map((img) => RawImage.read(img)));
  const processedInputs = await processorInstance(imagesToProcess, {
    return_tensors: "pt",
  });

  const { image_embeds } = await visionModelInstance(processedInputs) as { image_embeds: Tensor };
  return processAndNormalizeEmbeddings(image_embeds, isSingleInput);
}
