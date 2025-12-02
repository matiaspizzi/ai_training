
import { cardService } from '../lib/services/card-service';
import { searchService } from '../lib/services/search-service';
import { NbaCardSchemaDTO } from '../app/api/save-card/schema';
import { z } from 'zod';
import { pc } from '../lib/pinecone';

async function verify() {
  console.log('Starting verification...');

  const dummyCard: z.infer<typeof NbaCardSchemaDTO> = {
    player: 'Michael Jordan',
    year: '1996',
    brand: 'Topps Chrome',
    grade: 10,
    number: '139',
    condition: 'Gem Mint',
    serialNumber: 'N/A',
    cardName: 'Michael Jordan 1996 Topps Chrome Refractor',
    base64image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 pixel transparent png
  };

  console.log('Saving card...');
  try {
    const savedMetadata = await cardService.saveCard(dummyCard);
    console.log('Card saved. Metadata:', savedMetadata);
    const savedId = savedMetadata.id;
    console.log('Saved Card ID:', savedId);

    console.log('Waiting 10 seconds for indexing...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('Searching by text...');
    const results = await searchService.searchByText('Michael Jordan 1996');
    console.log('Search results:', JSON.stringify(results, null, 2));

    console.log(`Fetching record ${savedId} directly...`);
    const index = pc.index('text-index');
    const fetchResult = await index.fetch([savedId]);
    console.log('Fetch result:', JSON.stringify(fetchResult, null, 2));

    const found = results.find(r => r.id === savedId);
    if (found) {
      console.log('SUCCESS: Found card by ID.');
      if (found.metadata.imageUrl) {
        console.log('SUCCESS: Metadata contains imageUrl.');
      } else {
        console.error('FAILURE: Metadata missing imageUrl.');
      }
      if (found.metadata.player === 'Michael Jordan') {
        console.log('SUCCESS: Metadata contains correct player.');
      }
    } else {
      console.error('FAILURE: Could not find card in search results.');
    }

  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verify();
