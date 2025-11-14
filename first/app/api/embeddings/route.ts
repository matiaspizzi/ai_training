import { embed } from "ai";
import { google } from "@ai-sdk/google"


export async function POST(req: Request) {
  const result = await embed({
    model: google.textEmbeddingModel("gemini-embedding-001"),
    value: "A movie about AI and robotics.",
  })

  return Response.json({ result });
}