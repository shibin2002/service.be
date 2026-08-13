import { z } from 'zod';
import { AttachmentType } from '@prisma/client';

export const uploadMetaSchema = z.object({
  type: z.nativeEnum(AttachmentType),
});
