import prisma from '../prisma';
import { pc } from '../pinecone';
import { getTransformTextEmbeddings, getTransformImageEmbeddings } from '../embeddings';
import { uploadBase64ImageToS3, deleteImageFromS3, BUCKET_NAME } from '../s3';
import { NbaCardCreateSchema, NbaCardSchemaDTO } from '../../app/api/save-card/schema';
import { z } from 'zod';

export class CardService {
  private generateDescriptiveText(card: z.infer<typeof NbaCardSchemaDTO>): string {
    return `${card.player} ${card.year} ${card.brand} PSA ${card.grade} ${card.number} ${card.condition} ${card.serialNumber}`;
  }

  async saveCard(cardData: z.infer<typeof NbaCardSchemaDTO>) {
    let imageS3Key: string = '';
    let cardId: string = '';

    try {
      const descriptiveText = this.generateDescriptiveText(cardData);

      imageS3Key = await uploadBase64ImageToS3(cardData.base64image);
      const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${imageS3Key}`;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { base64image, ...rest } = cardData;
      const cardDataWithImageUrl: z.infer<typeof NbaCardCreateSchema> = {
        ...rest,
        imageUrl,
      };

      let [textEmbedding, visualEmbedding] = await Promise.all([
        getTransformTextEmbeddings([descriptiveText]),
        getTransformImageEmbeddings(cardDataWithImageUrl.imageUrl),
      ]);

      textEmbedding = textEmbedding as number[];
      visualEmbedding = visualEmbedding as number[];

      const createdCard = await prisma.card.create({
        data: cardDataWithImageUrl
      });
      cardId = createdCard.id;
      console.log(`Card stored in DB with ID: ${cardId}`);

      const textIndex = pc.index('text-index');
      const visualIndex = pc.index('visual-index');

      await Promise.all([
        textIndex.upsert([{
          id: cardId,
          values: textEmbedding,
          metadata: {
            player: createdCard.player,
            year: createdCard.year,
            grade: createdCard.grade ? createdCard.grade : 0
          }
        }]),
        visualIndex.upsert([{
          id: cardId,
          values: visualEmbedding,
          metadata: { type: 'visual_card' }
        }])
      ]);

      console.log(`Card stored in Pinecone with ID: ${cardId}.`);
      return createdCard;

    } catch (error) {
      if (imageS3Key) {
        await deleteImageFromS3(imageS3Key);
      }
      if (cardId) {
        await prisma.card.deleteMany({
          where: {
            id: { contains: cardId }
          }
        });
      }

      console.log(`Rolled back DB entry for key: ${cardId}`);
      throw error;
    }
  }
}

export const cardService = new CardService();
