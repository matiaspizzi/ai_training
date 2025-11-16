import { NextResponse } from "next/server";
import prisma from '../../../lib/prisma';
import { NbaCardCreateSchema } from './schema';

export async function POST(req: Request) {

  try {
    const body = await req.json();
    const objectData = body?.objectData ?? body;

    if (!objectData) {
      return NextResponse.json({ error: "No object data provided" }, { status: 400 });
    }

    const parsed = NbaCardCreateSchema.safeParse(objectData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const savedObject = await prisma.card.create({
      data: parsed.data,
    });

    return NextResponse.json({ savedObject }, { status: 201 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}