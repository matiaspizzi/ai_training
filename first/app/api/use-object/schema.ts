import { z } from 'zod';

export type NbaCardGrade = z.infer<typeof NbaCardGradeSchema>;
export type ImageError = z.infer<typeof ImageErrorSchema>;
export type CardGrade = NbaCardGrade | ImageError;

export const NbaCardGradeSchema = z.object({
  type: z.literal('grade'),
  cardName: z.string().describe('The official name of the card and player (e.g., "LeBron James 2003 Topps Chrome Refractor Rookie Card").'),
  year: z.string().describe('The release year of the card, represented as a string.'),
  brand: z.string().describe('The card brand and set name (e.g., "Topps Chrome", "Panini Prizm").'),
  player: z.string().describe('The full name of the NBA player on the card.'),
  estimatedGrade: z.number().min(1).max(10).describe('The estimated numerical grade of the card, from 1 to 10 (like PSA/BGS).'),
  notes: z.string().describe('A brief, professional analysis of the card condition, focusing on centering, corners, edges, and surface flaws.')
});

export const ImageErrorSchema = z.object({
  type: z.literal('error'),
  errorCode: z.literal('image_not_supported').describe('The standardized error code for unsupported or non-card images.'),
  reason: z.string().describe('A brief explanation why the image was not graded (e.g., "The image is a photo of a dog, not a basketball card.").')
});

export const cardGradeSchema = z.array(
  z.discriminatedUnion("type", [NbaCardGradeSchema, ImageErrorSchema])
).describe('An array of grading results. The array MUST contain one object for every file submitted by the user. Each object must be strictly a grade result or an error result.');
