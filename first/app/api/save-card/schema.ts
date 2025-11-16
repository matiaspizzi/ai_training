import { z } from 'zod';
import { NbaCardGradeSchema } from '../use-object/schema';

export const NbaCardDBSchema = NbaCardGradeSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  base64image: z.string(),
});

// Esquema para crear una carta (no incluye id/createdAt/updatedAt)
export const NbaCardCreateSchema = NbaCardDBSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  type: true,
});