import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || ''
});