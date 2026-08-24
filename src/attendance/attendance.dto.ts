import { z } from 'zod';

export const markAttendanceSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  status: z.boolean(),
});

export const bulkMarkAttendanceSchema = z.object({
  records: z.array(
    z.object({
      userId: z.string().uuid(),
      status: z.boolean(),
    }),
  ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export const updateAttendanceSchema = z.object({
  status: z.boolean(),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
