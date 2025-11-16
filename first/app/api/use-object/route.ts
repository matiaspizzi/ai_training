import { google } from "@ai-sdk/google"
import { streamObject } from 'ai';
import { cardGradeSchema } from "./schema";
import { NextResponse } from "next/server";
import { systemPrompt } from "./prompts";

export const maxDuration = 30;

const model = google("gemini-2.5-flash");

export async function POST(req: Request) {

  try {
    const { images } = await req.json();

    if (!images?.length) {
      return NextResponse.json({ error: "No se enviaron imágenes" }, { status: 400 });
    }

    const imageContents = images.map((img: { name: string; type: string; data: string }) => ({
      type: "image" as const,
      image: img.data,
      mimeType: img.type,
    }));

    const result = await streamObject({
      model,
      schema: cardGradeSchema,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            ...imageContents,
          ],
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}