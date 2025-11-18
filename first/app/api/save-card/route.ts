import { NextResponse } from "next/server";
import prisma from '../../../lib/prisma';
import { pc } from '../../../lib/pinecone';
import { getTransformTextEmbeddings, getTransformImageEmbeddings, initializeEmbedders } from '../../../lib/embeddingService';
import { z } from 'zod';
import { NbaCardCreateSchema, NbaCardSchemaDTO } from './schema'; 
import { uploadBase64ImageToS3, deleteImageFromS3, BUCKET_NAME } from '../../../lib/s3';

const SaveCardSchema = z.object({
  cards: z.array(NbaCardSchemaDTO),
});

const generateDescriptiveText = (card: z.infer<typeof NbaCardSchemaDTO>): string => {
  return `${card.player} ${card.year} ${card.brand} PSA ${card.grade} ${card.number} ${card.condition} ${card.serialNumber}`;
};


export async function POST(req: Request) {
  await initializeEmbedders();

  try {
    const body = await req.json();
    const parsed = SaveCardSchema.safeParse(body.data);

    if (!parsed.success) {
      console.warn("Validation failed:", parsed.error.issues);
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const processingPromises = parsed.data.cards.map(async (cardData) => {
      let imageS3Key: string = '';
      let cardId: string = '';
      try {
        const descriptiveText = generateDescriptiveText(cardData);

        imageS3Key = await uploadBase64ImageToS3(cardData.base64image);
        const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${imageS3Key}`;
        const { base64image, ...rest } = cardData;
        const cardDataWithImageUrl: typeof NbaCardCreateSchema = {
          ...rest,
          imageUrl,
        };

        const [textEmbedding, visualEmbedding] = await Promise.all([
          getTransformTextEmbeddings([descriptiveText]),
          getTransformImageEmbeddings(cardDataWithImageUrl.imageUrl),
        ]);

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
        await deleteImageFromS3(imageS3Key);
        await prisma.card.deleteMany({
          where: {
            id: { contains: cardId }
          }
        });

        console.log(`Rolled back DB entry for key: ${cardId}`);
        throw error;
      }
    });

    const savedCards = await Promise.all(processingPromises);

    return NextResponse.json({ savedCards }, { status: 201 });
  } catch (error) {
    console.error("Error during card saving and vectorization:", error);

    return NextResponse.json({
      error: "Internal Server Error during vectorization/persistence",
      details: String(error)
    }, { status: 500 });
  }
}