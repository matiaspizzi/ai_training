import { NextResponse } from "next/server";
import { z } from 'zod';
import { NbaCardSchemaDTO } from './schema';
import { cardService } from '../../../lib/services/card-service';
import { handleApiError } from '../../../lib/api-utils';

const SaveCardSchema = z.object({
  cards: z.array(NbaCardSchemaDTO),
});

export async function POST(req: Request) {
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

    // TODO: Convert this to bulk store
    const processingPromises = parsed.data.cards.map(async (cardData) => {
      return cardService.saveCard(cardData);
    });

    const savedCards = await Promise.all(processingPromises);

    return NextResponse.json({ savedCards }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}