import { NextResponse } from "next/server";
import { z } from 'zod';
import { NbaCardSchemaDTO } from './schema';
import { cardService } from '../../../lib/services/card-service';
import { handleApiError } from '../../../lib/api-utils';
import logger from '../../../lib/logger';

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

    // Bulk store
    const result = await cardService.saveCards(parsed.data.cards);

    if (result.errors.length > 0) {
      logger.warn({ errors: result.errors }, "Some cards failed to save");
    }

    return NextResponse.json({ savedCards: result.cards, errors: result.errors }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}