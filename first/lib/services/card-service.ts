import logger from '../logger';
import { v4 as uuidv4 } from 'uuid';
import { pc } from '../pinecone';
import { getTransformTextEmbeddings, getTransformImageEmbeddings } from '../embeddings';
import { uploadBase64ImageToS3, deleteImageFromS3, BUCKET_NAME } from '../s3';
import { NbaCardSchemaDTO } from '../../app/api/save-card/schema';
import { z } from 'zod';

type CardWithId = z.infer<typeof NbaCardSchemaDTO> & { id: string };
type UploadedCard = Omit<CardWithId, 'base64image'> & {
  imageUrl: string;
  type: 'card';
  descriptiveText: string;
};

export class CardService {
  private generateDescriptiveText(card: z.infer<typeof NbaCardSchemaDTO>): string {
    return `${card.player} ${card.year} ${card.brand} PSA ${card.grade} ${card.number} ${card.condition} ${card.serialNumber}`;
  }

  private async filterDuplicates(cards: CardWithId[], errors: { id: string; error: string }[]): Promise<CardWithId[]> {
    const uniqueCards: CardWithId[] = [];
    const index = pc.index('text-index');

    for (const card of cards) {
      if (card.serialNumber && card.serialNumber !== 'N/A') {
        try {
          const queryResult = await index.query({
            vector: new Array(512).fill(0),
            topK: 1,
            filter: { serialNumber: { $eq: card.serialNumber } },
            includeMetadata: false
          });

          if (queryResult.matches && queryResult.matches.length > 0) {
            logger.warn({ serialNumber: card.serialNumber }, "Duplicate serial number found. Skipping.");
            errors.push({ id: card.id, error: `Duplicate serial number: ${card.serialNumber}` });
            continue;
          }
        } catch (error) {
          logger.error({ err: error, serialNumber: card.serialNumber }, "Failed to check for duplicates");
          errors.push({ id: card.id, error: `Failed to check for duplicates: ${error instanceof Error ? error.message : String(error)}` });
          continue;
        }
      }
      uniqueCards.push(card);
    }
    return uniqueCards;
  }

  private async uploadImages(cards: CardWithId[], errors: { id: string; error: string }[]): Promise<UploadedCard[]> {
    const uploadPromises = cards.map(async (card) => {
      try {
        const imageS3Key = await uploadBase64ImageToS3(card.base64image);
        const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${imageS3Key}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { base64image, ...rest } = card;

        return {
          ...rest,
          imageUrl,
          type: 'card' as const,
          descriptiveText: this.generateDescriptiveText(card)
        };
      } catch (error) {
        logger.error({ err: error, cardId: card.id }, "Failed to upload image for card");
        errors.push({ id: card.id, error: "Image upload failed" });
        return null;
      }
    });

    return (await Promise.all(uploadPromises)).filter((c): c is UploadedCard => c !== null);
  }

  private async generateEmbeddings(cards: UploadedCard[]) {
    const descriptiveTexts = cards.map(c => c.descriptiveText);
    const imageUrls = cards.map(c => c.imageUrl);

    const [textEmbeddings, visualEmbeddings] = await Promise.all([
      getTransformTextEmbeddings(descriptiveTexts),
      getTransformImageEmbeddings(imageUrls)
    ]);

    const textEmbeds = Array.isArray(textEmbeddings[0]) ? textEmbeddings as number[][] : [textEmbeddings as number[]];
    const visualEmbeds = Array.isArray(visualEmbeddings[0]) ? visualEmbeddings as number[][] : [visualEmbeddings as number[]];

    return { textEmbeds, visualEmbeds };
  }

  private async upsertToPinecone(cards: UploadedCard[], textEmbeds: number[][], visualEmbeds: number[][]) {
    const textIndex = pc.index('text-index');
    const visualIndex = pc.index('visual-index');

    const textVectors = cards.map((card, i) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { descriptiveText, ...metadata } = card;
      return {
        id: card.id,
        values: textEmbeds[i],
        metadata
      };
    });

    const visualVectors = cards.map((card, i) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { descriptiveText, ...metadata } = card;
      return {
        id: card.id,
        values: visualEmbeds[i],
        metadata: { ...metadata, type: 'visual_card' }
      };
    });

    await Promise.all([
      textIndex.upsert(textVectors),
      visualIndex.upsert(visualVectors)
    ]);
  }

  private async cleanupImages(cards: UploadedCard[]) {
    const cleanupPromises = cards.map(card => {
      try {
        const parts = card.imageUrl.split('/');
        const key = parts[parts.length - 1];
        return deleteImageFromS3(key);
      } catch (cleanupError) {
        logger.error({ err: cleanupError, cardId: card.id }, "Failed to cleanup image during rollback");
        return Promise.resolve();
      }
    });

    await Promise.all(cleanupPromises);
    logger.info(`Cleaned up ${cards.length} images from S3.`);
  }

  async saveCards(cardsData: z.infer<typeof NbaCardSchemaDTO>[]) {
    const errors: { id: string; error: string }[] = [];

    const cardsWithIds = cardsData.map(card => ({
      ...card,
      id: uuidv4(),
    }));

    logger.info(`Starting bulk save for ${cardsWithIds.length} cards.`);

    const uniqueCards = await this.filterDuplicates(cardsWithIds, errors);

    if (uniqueCards.length === 0) {
      logger.warn("No unique cards to process.");
      return { processed: 0, errors };
    }

    const uploadedCards = await this.uploadImages(uniqueCards, errors);

    if (uploadedCards.length === 0) {
      logger.error("No cards were successfully processed for upload.");
      return { processed: 0, errors };
    }

    try {
      const { textEmbeds, visualEmbeds } = await this.generateEmbeddings(uploadedCards);
      await this.upsertToPinecone(uploadedCards, textEmbeds, visualEmbeds);

      logger.info(`Successfully bulk saved ${uploadedCards.length} cards.`);

      return {
        processed: uploadedCards.length,
        errors,
        cards: uploadedCards
      };

    } catch (error) {
      logger.error({ err: error }, "Failed to generate embeddings or upsert to Pinecone during bulk save. Cleaning up S3 images...");
      await this.cleanupImages(uploadedCards);
      throw error;
    }
  }
}

export const cardService = new CardService();
