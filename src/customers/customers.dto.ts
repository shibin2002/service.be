import { z } from 'zod';
import { paginationSchema } from '../common/utils/pagination';

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersSchema = paginationSchema;

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
