import { z } from 'zod';
import { EnquiryStatus } from '@prisma/client';
import { paginationSchema } from '../common/utils/pagination';

export const createEnquirySchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().min(2).max(500),
  phone: z.string().min(7).max(20),
  enquiry: z.string().min(3).max(2000),
  status: z.nativeEnum(EnquiryStatus).optional(),
  rejectionReason: z.string().max(2000).optional().nullable(),
});

export const updateEnquirySchema = createEnquirySchema.partial();

export const listEnquiriesSchema = paginationSchema;

export type CreateEnquiryDto = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryDto = z.infer<typeof updateEnquirySchema>;