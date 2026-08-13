import { z } from 'zod';

export const createStageSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().max(300).optional().nullable(),
  color: z.string().max(20).optional(),
  isFinal: z.boolean().optional(),
});

export const updateStageSchema = createStageSchema.partial();

export const reorderStagesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

export type CreateStageDto = z.infer<typeof createStageSchema>;
export type UpdateStageDto = z.infer<typeof updateStageSchema>;
