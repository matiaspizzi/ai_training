import { cardService } from '../lib/services/card-service';
import { searchService } from '../lib/services/search-service';
import { NbaCardSchemaDTO } from '../app/api/save-card/schema';
import { z } from 'zod';
import { pc } from '../lib/pinecone';

async function verifyBulkSave() {
  console.log('Starting bulk save verification...');

  // 1. Create dummy card data
  const dummyCards: z.infer<typeof NbaCardSchemaDTO>[] = [
    {
      player: 'Kobe Bryant',
      year: '1996',
      brand: 'Topps Chrome',
      grade: 10,
      condition: 'Gem Mint',
      number: '138',
      serialNumber: 'N/A',
      base64image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 pixel transparent png
      cardName: 'Kobe Bryant 1996 Topps Chrome'
    },
    {
      player: 'LeBron James',
      year: '2003',
      brand: 'Topps Chrome',
      grade: 10,
      condition: 'Gem Mint',
      number: '111',
      serialNumber: 'N/A',
      base64image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 pixel transparent png
      cardName: 'LeBron James 2003 Topps Chrome'
    }
  ];

  try {
    const result = await cardService.saveCards(dummyCards);
    console.log('Bulk save result:', JSON.stringify(result, null, 2));

    if (result.processed !== 2) {
      throw new Error(`Expected 2 processed cards, got ${result.processed}`);
    }

    const savedIds = (result.cards || []).map((c: any) => c.id);
    console.log('Saved Card IDs:', savedIds);

    // Wait for eventual consistency
    console.log('Waiting 10 seconds for indexing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Searching by text for Kobe...');
    const kobeResults = await searchService.searchByText('Kobe Bryant 1996');
    console.log('Kobe Search results:', JSON.stringify(kobeResults, null, 2));

    const foundKobe = kobeResults.some(r => r.metadata.player === 'Kobe Bryant');
    if (!foundKobe) {
      console.error('FAILURE: Could not find Kobe card in search results.');
    } else {
      console.log('SUCCESS: Found Kobe card.');
    }

    // 3. Verify metadata for both
    console.log('Verifying metadata directly...');
    const index = pc.index('text-index');
    const fetchResult = await index.fetch(savedIds);

    if (Object.keys(fetchResult.records).length !== 2) {
      console.error('FAILURE: Could not fetch all records.');
    } else {
      console.log('SUCCESS: Fetched all records.');
    }

  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyBulkSave();
