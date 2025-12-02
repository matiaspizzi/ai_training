
import { cardService } from '../lib/services/card-service';
import { NbaCardSchemaDTO } from '../app/api/save-card/schema';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

async function verifyDuplicates() {
  console.log('Starting duplicate verification...');

  const serialNumber = `TEST-${uuidv4().substring(0, 8)}`;
  console.log(`Using serial number: ${serialNumber}`);

  const card1: z.infer<typeof NbaCardSchemaDTO> = {
    player: 'Duplicate Test Player',
    year: '2024',
    brand: 'Test Brand',
    grade: 10,
    number: '1',
    condition: 'Gem Mint',
    serialNumber: serialNumber,
    cardName: 'Duplicate Test Card 1',
    base64image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  const card2: z.infer<typeof NbaCardSchemaDTO> = {
    player: 'Duplicate Test Player',
    year: '2024',
    brand: 'Test Brand',
    grade: 10,
    number: '1',
    condition: 'Gem Mint',
    serialNumber: serialNumber, // Same serial number
    cardName: 'Duplicate Test Card 2',
    base64image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  const card3: z.infer<typeof NbaCardSchemaDTO> = {
    player: 'Duplicate Test Player',
    year: '2024',
    brand: 'Test Brand',
    grade: 10,
    number: '2',
    condition: 'Gem Mint',
    serialNumber: 'N/A', // N/A should allow duplicates
    cardName: 'Duplicate Test Card 3 (N/A)',
    base64image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  const card4: z.infer<typeof NbaCardSchemaDTO> = {
    player: 'Duplicate Test Player',
    year: '2024',
    brand: 'Test Brand',
    grade: 10,
    number: '2',
    condition: 'Gem Mint',
    serialNumber: 'N/A', // N/A should allow duplicates
    cardName: 'Duplicate Test Card 4 (N/A)',
    base64image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  try {
    // 1. Save first card
    console.log('Saving first card...');
    const result1 = await cardService.saveCards([card1]);
    console.log('Result 1:', JSON.stringify(result1, null, 2));

    if (result1.processed !== 1) throw new Error('Failed to save first card');

    // Wait for consistency
    console.log('Waiting 5s for indexing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Try to save duplicate card
    console.log('Saving duplicate card...');
    const result2 = await cardService.saveCards([card2]);
    console.log('Result 2:', JSON.stringify(result2, null, 2));

    if (result2.processed !== 0) throw new Error('Should not have processed duplicate card');
    if (result2.errors.length !== 1 || !result2.errors[0].error.includes('Duplicate serial number')) {
      throw new Error('Did not receive expected duplicate error');
    }
    console.log('SUCCESS: Duplicate card rejected.');

    // 3. Save N/A cards
    console.log('Saving N/A cards...');
    const result3 = await cardService.saveCards([card3, card4]);
    console.log('Result 3:', JSON.stringify(result3, null, 2));

    if (result3.processed !== 2) throw new Error('Should have processed both N/A cards');
    console.log('SUCCESS: N/A cards accepted.');

  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyDuplicates();
