import bcrypt from 'bcryptjs';
import { PrismaClient, Priority, Role } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  { name: 'Received', slug: 'received', color: '#3B82F6', isDefault: true, isFinal: false },
  { name: 'Inspection', slug: 'inspection', color: '#8B5CF6', isDefault: true, isFinal: false },
  {
    name: 'Waiting For Approval',
    slug: 'waiting-for-approval',
    color: '#F59E0B',
    isDefault: true,
    isFinal: false,
  },
  {
    name: 'Waiting For Parts',
    slug: 'waiting-for-parts',
    color: '#EF4444',
    isDefault: true,
    isFinal: false,
  },
  { name: 'Repairing', slug: 'repairing', color: '#06B6D4', isDefault: true, isFinal: false },
  {
    name: 'Quality Check',
    slug: 'quality-check',
    color: '#14B8A6',
    isDefault: true,
    isFinal: false,
  },
  {
    name: 'Ready For Pickup',
    slug: 'ready-for-pickup',
    color: '#22C55E',
    isDefault: true,
    isFinal: false,
  },
  { name: 'Delivered', slug: 'delivered', color: '#64748B', isDefault: true, isFinal: true },
  { name: 'Cancelled', slug: 'cancelled', color: '#9CA3AF', isDefault: true, isFinal: true },
];

async function main() {
  console.log('Seeding database...');

  for (let i = 0; i < DEFAULT_STAGES.length; i++) {
    const stage = DEFAULT_STAGES[i];
    await prisma.workflowStage.upsert({
      where: { slug: stage.slug },
      update: {
        name: stage.name,
        color: stage.color,
        sortOrder: i,
        isDefault: stage.isDefault,
        isFinal: stage.isFinal,
        deletedAt: null,
      },
      create: {
        ...stage,
        sortOrder: i,
        description: `Default stage: ${stage.name}`,
      },
    });
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@servicecenter.com').toLowerCase();

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: Role.ADMIN, isActive: true, deletedAt: null },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      fullName: 'System Admin',
      phone: '9999999999',
      role: Role.ADMIN,
    },
  });

  const managerHash = await bcrypt.hash('Manager@123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@servicecenter.com' },
    update: {},
    create: {
      email: 'manager@servicecenter.com',
      passwordHash: managerHash,
      fullName: 'Priya Manager',
      phone: '9888888888',
      role: Role.MANAGER,
    },
  });

  const techHash = await bcrypt.hash('Tech@12345', 12);
  const tech = await prisma.user.upsert({
    where: { email: 'tech@servicecenter.com' },
    update: {},
    create: {
      email: 'tech@servicecenter.com',
      passwordHash: techHash,
      fullName: 'Arun Technician',
      phone: '9777777777',
      role: Role.TECHNICIAN,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul@example.com',
      address: '12 MG Road, Bengaluru',
    },
  });

  const device = await prisma.device.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      deviceType: 'Smartphone',
      brand: 'Samsung',
      model: 'Galaxy S23',
      color: 'Black',
      imei: '356938035643809',
      serialNumber: 'SN-S23-001',
      accessoriesReceived: 'Charger, Case',
      physicalCondition: 'Scratches on back glass',
    },
  });

  const received = await prisma.workflowStage.findUniqueOrThrow({ where: { slug: 'received' } });

  const existingJob = await prisma.serviceJob.findFirst({
    where: { jobNumber: 'JOB-2026-00001' },
  });

  if (!existingJob) {
    await prisma.jobCounter.upsert({
      where: { id: 'default' },
      update: { year: 2026, sequence: 1 },
      create: { id: 'default', year: 2026, sequence: 1 },
    });

    const job = await prisma.serviceJob.create({
      data: {
        jobNumber: 'JOB-2026-00001',
        customerId: customer.id,
        deviceId: device.id,
        reportedIssue: 'Screen not responding to touch',
        diagnosis: 'Digitizer failure suspected',
        technicianNotes: 'Awaiting parts approval',
        assignedTechnicianId: tech.id,
        createdById: admin.id,
        priority: Priority.HIGH,
        warranty: false,
        currentStageId: received.id,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.stageLog.create({
      data: {
        jobId: job.id,
        stageId: received.id,
        userId: admin.id,
        note: 'Seed job created',
      },
    });

    await prisma.payment.create({
      data: {
        jobId: job.id,
        paid: 500,
        total: 4499,
        balance: 3999,
        status: 'PARTIAL',
        recordedById: manager.id,
        items: {
          create: [
            { name: 'Inspection', amount: 299 },
            { name: 'Repair', amount: 2500 },
            { name: 'Parts', amount: 1800 },
            { name: 'Discount', amount: -100 },
          ],
        },
      },
    });
  }

  console.log('Seed complete.');
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log('Manager: manager@servicecenter.com / Manager@123');
  console.log('Technician: tech@servicecenter.com / Tech@12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
