import { z } from 'zod';
import { PaymentStatus, Priority } from '@prisma/client';
import { paginationSchema } from '../common/utils/pagination';

export const createJobSchema = z.object({
  customerId: z.string().uuid().optional(),
  customer: z
    .object({
      name: z.string().min(2),
      phone: z.string().min(7),
      email: z.string().email().optional().nullable(),
      address: z.string().optional().nullable(),
    })
    .optional(),
  deviceId: z.string().uuid().optional(),
  device: z
    .object({
      deviceType: z.string().min(1),
      brand: z.string().min(1),
      model: z.string().min(1),
      color: z.string().optional().nullable(),
      imei: z.string().optional().nullable(),
      serialNumber: z.string().optional().nullable(),
      accessoriesReceived: z.string().optional().nullable(),
      physicalCondition: z.string().optional().nullable(),
    })
    .optional(),
  reportedIssue: z.string().min(3),
  diagnosis: z.string().optional().nullable(),
  technicianNotes: z.string().optional().nullable(),
  assignedTechnicianId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  warranty: z.boolean().optional(),
  estimatedDelivery: z.coerce.date().optional().nullable(),
  stageId: z.string().uuid().optional(),
}).refine((d) => d.customerId || d.customer, {
  message: 'customerId or customer is required',
}).refine((d) => d.deviceId || d.device, {
  message: 'deviceId or device is required',
});

export const updateJobSchema = z.object({
  reportedIssue: z.string().min(3).optional(),
  diagnosis: z.string().optional().nullable(),
  technicianNotes: z.string().optional().nullable(),
  assignedTechnicianId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  warranty: z.boolean().optional(),
  estimatedDelivery: z.coerce.date().optional().nullable(),
  currentStageId: z.string().uuid().optional(),
  stageNote: z.string().optional(),
});

export const changeStageSchema = z.object({
  stageId: z.string().uuid(),
  note: z.string().max(1000).optional(),
});

export const listJobsSchema = paginationSchema.extend({
  status: z.string().optional(),
  stageId: z.string().uuid().optional(),
  technicianId: z.string().uuid().optional(),
  deviceType: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateJobDto = z.infer<typeof createJobSchema>;
export type UpdateJobDto = z.infer<typeof updateJobSchema>;
