import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { google } from "@ai-sdk/google"
import { handleApiError } from '@/lib/api-utils';
import { searchService } from '@/lib/services/search-service';

import logger from '@/lib/logger';

export const maxDuration = 30;

const model = google("gemini-2.5-flash");

export async function POST(req: Request) {
  try {
    const {
      messages,
      data
    }: {
      messages: UIMessage[];
      data?: { image?: string };
    } = await req.json();

    const lastMessage = messages[messages.length - 1];
    let context = "";

    if (data?.image) {
      const searchResults = await searchService.searchByImage(data.image);
      context = `Found similar cards based on the uploaded image:\n${JSON.stringify(searchResults, null, 2)}`;
    } else if (lastMessage.role === 'user') {
      logger.info("searching by text")
      const textContent = lastMessage.parts.filter(part => part.type === 'text').map(part => part.text).join('');
      const searchResults = await searchService.searchByText(textContent);
      context = `Found similar cards based on your query:\n${JSON.stringify(searchResults, null, 2)}`;
    }

    const result = streamText({
      model: model,
      messages: [{
        role: 'system',
        content: `You are a helpful assistant for NBA card collectors.
      Use the following context about similar cards to answer the user's question.
      If the context doesn't contain relevant information, answer based on your general knowledge but mention that you couldn't find specific cards in the database.
      
      Context:
      ${context}`
      }, ...convertToModelMessages(messages)],
    });
    logger.info("result stream created");
    return result.toTextStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}