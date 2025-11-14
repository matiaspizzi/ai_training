import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { google } from "@ai-sdk/google"

export const maxDuration = 30;

const model = google("gemini-2.5-flash");

export async function POST(req: Request) {
  const {
    messages,
  }: {
    messages: UIMessage[];
  } = await req.json();
  const result = streamText({
    model: model,
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}