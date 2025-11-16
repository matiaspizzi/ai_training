// /app/api/save-card/route.ts

import { NextResponse } from "next/server";
import prisma from '../../../lib/prisma';
import { pc } from '../../../lib/pinecone';
import { getTransformTextEmbedding, getTransformVisualEmbedding, initializeEmbedders } from '../../../lib/embeddingService';
import { z } from 'zod';
import { NbaCardCreateSchema } from './schema'; 

const SaveCardSchema = z.object({
  cards: z.array(NbaCardCreateSchema),
});

const generateDescriptiveText = (card: z.infer<typeof NbaCardCreateSchema>): string => {
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

      const descriptiveText = generateDescriptiveText(cardData);

      const [textEmbedding, visualEmbedding] = await Promise.all([
        getTransformTextEmbedding(descriptiveText),
        getTransformVisualEmbedding(cardData.base64image),
      ]);

      const createdCard = await prisma.card.create({
        data: cardData as any
      });
      const cardId = createdCard.id;

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

      console.log(`Carta ${cardId} guardada y vectorizada con Transform JS.`);
      return createdCard;
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