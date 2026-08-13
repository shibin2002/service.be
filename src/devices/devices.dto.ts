import { z } from 'zod';
import { paginationSchema } from '../common/utils/pagination';

export const createDeviceSchema = z.object({
  deviceType: z.string().min(1).max(80),
  brand: z.string().min(1).max(80),
  model: z.string().min(1).max(120),
  color: z.string().max(60).optional().nullable(),
  imei: z.string().max(30).optional().nullable(),
  serialNumber: z.string().max(80).optional().nullable(),
  accessoriesReceived: z.string().max(1000).optional().nullable(),
  physicalCondition: z.string().max(1000).optional().nullable(),
});

export const updateDeviceSchema = createDeviceSchema.partial();
export const listDevicesSchema = paginationSchema.extend({
  deviceType: z.string().optional(),
});

export type CreateDeviceDto = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceDto = z.infer<typeof updateDeviceSchema>;
