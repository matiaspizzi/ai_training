import { z } from 'zod';
import { NbaCardGradeSchema } from '../use-object/schema';

export const NbaCardSchemaDTO = NbaCardGradeSchema.extend({
  base64image: z.string(),
}).omit({
  type: true,
});

export const NbaCardCreateSchema = NbaCardSchemaDTO.extend({
  imageUrl: z.string().url()
}).omit({
  base64image: true,
});