import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

const DOCUMENT_CATEGORIES = [
  'Financial Statements',
  'Bank Statements',
  'Purchase/Sales Register',
  'TDS Certificates',
  'PAN/Aadhaar/KYC',
  'DSC',
  'Agreements',
  'Notices/Orders',
  'Filed Returns',
] as const

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async listAll(orgId: string) {
    return this.prisma.document.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } }, task: { select: { title: true } } },
    })
  }

  async listByClient(orgId: string, clientId: string) {
    return this.prisma.document.findMany({
      where: { orgId, clientId },
      orderBy: { createdAt: 'desc' },
      include: { task: { select: { title: true } } },
    })
  }

  async listByTask(orgId: string, taskId: string) {
    return this.prisma.document.findMany({
      where: { orgId, taskId },
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } } },
    })
  }

  async search(orgId: string, q: string, category?: string) {
    const where: any = {
      orgId,
      ...(category ? { category } : {}),
      OR: [
        { fileName: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ],
    }
    return this.prisma.document.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  async listWithFilters(
    orgId: string,
    filters: { clientId?: string; taskId?: string; category?: string; from?: string; to?: string },
  ) {
    const where: any = { orgId }

    if (filters.clientId) where.clientId = filters.clientId
    if (filters.taskId) where.taskId = filters.taskId
    if (filters.category) where.category = filters.category
    if (filters.from || filters.to) {
      where.createdAt = {}
      if (filters.from) where.createdAt.gte = new Date(filters.from)
      if (filters.to) where.createdAt.lte = new Date(filters.to)
    }

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } }, task: { select: { title: true } } },
    })
  }

  async upload(orgId: string, data: any) {
    return this.prisma.document.create({ data: { ...data, org: { connect: { id: orgId } } } as any })
  }

  async reupload(orgId: string, id: string, data: any) {
    const existing = await this.prisma.document.findFirst({ where: { id, orgId } })
    if (!existing) return null

    const nextVersion = existing.version + 1
    return this.prisma.document.update({
      where: { id },
      data: {
        fileUrl: data.fileUrl,
        fileName: data.fileName ?? existing.fileName,
        fileType: data.fileType ?? existing.fileType,
        fileSize: data.fileSize ?? existing.fileSize,
        version: nextVersion,
        uploadedBy: data.uploadedBy,
        uploadedByType: data.uploadedByType,
      },
    })
  }

  async bulkDownload(orgId: string, documentIds: string[]) {
    if (!documentIds.length) return { zipUrl: null }
    const docs = await this.prisma.document.findMany({ where: { id: { in: documentIds }, orgId } })
    return {
      zipUrl: `/api/files/bulk-download?orgId=${orgId}&ids=${documentIds.join(',')}`,
      count: docs.length,
    }
  }
}
