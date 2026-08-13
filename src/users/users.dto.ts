import { z } from 'zod';
import { Role } from '@prisma/client';
import { paginationSchema } from '../common/utils/pagination';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20).optional().nullable(),
  role: z.nativeEnum(Role).optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(20).optional().nullable(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export const listUsersSchema = paginationSchema.extend({
  role: z.nativeEnum(Role).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
