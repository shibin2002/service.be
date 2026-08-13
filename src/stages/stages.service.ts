import prisma from '../prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../common/errors/AppError';
import { CreateStageDto, UpdateStageDto } from './stages.dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export class StagesService {
  async list() {
    return prisma.workflowStage.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getById(id: string) {
    const stage = await prisma.workflowStage.findFirst({ where: { id, deletedAt: null } });
    if (!stage) throw new NotFoundError('Stage');
    return stage;
  }

  async create(dto: CreateStageDto) {
    const slug = dto.slug ?? slugify(dto.name);
    const existing = await prisma.workflowStage.findFirst({
      where: { OR: [{ name: dto.name }, { slug }], deletedAt: null },
    });
    if (existing) throw new ConflictError('Stage name or slug already exists');

    const max = await prisma.workflowStage.aggregate({
      where: { deletedAt: null },
      _max: { sortOrder: true },
    });

    return prisma.workflowStage.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        color: dto.color,
        isFinal: dto.isFinal ?? false,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async update(id: string, dto: UpdateStageDto) {
    await this.getById(id);
    return prisma.workflowStage.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug ?? (dto.name ? slugify(dto.name) : undefined),
      },
    });
  }

  async softDelete(id: string) {
    const stage = await this.getById(id);
    if (stage.isDefault) {
      throw new ValidationError('Default stages cannot be deleted');
    }

    const inUse = await prisma.serviceJob.count({
      where: { currentStageId: id, deletedAt: null },
    });
    if (inUse > 0) {
      throw new ConflictError('Stage is in use by active jobs');
    }

    await prisma.workflowStage.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Stage deleted' };
  }

  async reorder(orderedIds: string[]) {
    const stages = await this.list();
    if (orderedIds.length !== stages.length) {
      throw new ValidationError('orderedIds must include all active stages');
    }

    const idSet = new Set(stages.map((s) => s.id));
    for (const id of orderedIds) {
      if (!idSet.has(id)) throw new ValidationError(`Unknown stage id: ${id}`);
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.workflowStage.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );

    return this.list();
  }
}

export const stagesService = new StagesService();
