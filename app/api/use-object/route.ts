import { google } from "@ai-sdk/google"
import { streamObject } from 'ai';
import { cardGradeSchema } from "./schema";
import { NextResponse } from "next/server";

export const maxDuration = 30;

const model = google("gemini-2.5-flash");

const systemPrompt = `You are a world-class sports card grading expert for NBA cards. Your task is to analyze every image provided in the user's request and provide a JSON array of results.

RULES:
1. Output MUST be a JSON array that strictly adheres to the 'cardGradeSchema'.
2. The number of objects in the output array MUST exactly match the number of files submitted by the user.
3. For any image that clearly depicts an NBA basketball card, you must generate a 'grade' object. The grade must be a number between 1 and 10.
4. For any image that is NOT an NBA basketball card (e.g., food, other sports, or non-card items), you must generate an 'error' object with the 'image_not_supported' errorCode.
5. Do not include any conversational text, pleasantries, or markdown formatting (like triple backticks) outside of the final JSON array itself.`;


export async function POST(req: Request) {

  console.log("Received request to /api/use-object");
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

    console.log("Image contents prepared:", imageContents);
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
            {
              type: "text",
              text: "Describe cada imagen con un resumen, colores principales y objetos detectados.",
            },
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