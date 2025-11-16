import { NextResponse } from "next/server";
import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { NbaCardCreateSchema } from './schema';

const SaveCardSchema = z.object({
  cards: z.array(NbaCardCreateSchema),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SaveCardSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const savedCards = await Promise.all(
      parsed.data.cards.map((card) =>
        prisma.card.create({ data: card })
      )
    );

    return NextResponse.json({ savedCards }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}