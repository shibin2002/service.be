import { z } from 'zod';
import { PaymentStatus } from '@prisma/client';
import { paginationSchema } from '../common/utils/pagination';

export const paymentItemSchema = z.object({
  name: z.string().min(1),
  amount: z.coerce.number(),
});

export const updatePaymentSchema = z.object({
  items: z.array(paymentItemSchema).min(1),
  paid: z.coerce.number().min(0).optional(),
});

export const listPaymentsSchema = paginationSchema.extend({
  status: z.nativeEnum(PaymentStatus).optional(),
});

export type PaymentItemDto = z.infer<typeof paymentItemSchema>;
export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>;