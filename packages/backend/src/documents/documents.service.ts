import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Response } from 'express'
import archiver from 'archiver'

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

  async listByEvent(orgId: string, eventId: string) {
    return this.prisma.document.findMany({
      where: { orgId, eventId },
      orderBy: { createdAt: 'desc' },
      include: { event: { select: { title: true } } },
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
    const cleaned = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null && v !== undefined)) as any
    if (!cleaned.fileUrl && cleaned.fileName) {
      cleaned.fileUrl = `/uploads/${Date.now()}_${cleaned.fileName}`
    }
    return this.prisma.document.create({ data: { ...cleaned, org: { connect: { id: orgId } } } as any })
  }

  async uploadFile(orgId: string, body: any) {
    const cleaned = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null && v !== undefined)) as any
    if (!cleaned.fileData) {
      throw new BadRequestException('fileData is required')
    }
    if (!cleaned.fileName) {
      throw new BadRequestException('fileName is required')
    }
    if (!cleaned.category) {
      throw new BadRequestException('category is required')
    }
    const maxSize = 10 * 1024 * 1024
    if (cleaned.fileSize && cleaned.fileSize > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit')
    }
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'text/csv',
    ]
    if (cleaned.fileType && !allowedTypes.includes(cleaned.fileType)) {
      throw new BadRequestException(`File type ${cleaned.fileType} is not allowed`)
    }
    const createData: any = {
      org: { connect: { id: orgId } },
      fileName: cleaned.fileName,
      fileType: cleaned.fileType || 'application/octet-stream',
      fileSize: cleaned.fileSize || 0,
      category: cleaned.category,
      fileUrl: cleaned.fileData,
      uploadedBy: cleaned.uploadedBy,
      uploadedByType: cleaned.uploadedByType || 'staff',
      isPublic: cleaned.isPublic || false,
    }
    if (cleaned.clientId) createData.client = { connect: { id: cleaned.clientId } }
    if (cleaned.taskId) createData.task = { connect: { id: cleaned.taskId } }
    if (cleaned.eventId) createData.event = { connect: { id: cleaned.eventId } }
    return this.prisma.document.create({
      data: createData,
    } as any)
  }

  async reupload(orgId: string, id: string, body: any) {
    const existing = await this.prisma.document.findFirst({ where: { id, orgId } })
    if (!existing) return null

    const nextVersion = existing.version + 1
    return this.prisma.document.update({
      where: { id },
      data: {
        fileUrl: body.fileUrl || existing.fileUrl,
        fileName: body.fileName ?? existing.fileName,
        fileType: body.fileType ?? existing.fileType,
        fileSize: body.fileSize ?? existing.fileSize,
        version: nextVersion,
        uploadedBy: body.uploadedBy,
        uploadedByType: body.uploadedByType,
      },
    })
  }

  async reuploadFile(orgId: string, id: string, body: any) {
    const existing = await this.prisma.document.findFirst({ where: { id, orgId } })
    if (!existing) return null

    const nextVersion = existing.version + 1
    return this.prisma.document.update({
      where: { id },
      data: {
        fileUrl: body.fileData || existing.fileUrl,
        fileType: body.fileType || existing.fileType,
        fileSize: body.fileSize || existing.fileSize,
        version: nextVersion,
        uploadedBy: body.uploadedBy,
        uploadedByType: body.uploadedByType || existing.uploadedByType,
      },
    })
  }

  async getDocument(orgId: string, id: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, orgId } })
    if (!doc) return null
    return doc
  }

  async bulkDownload(orgId: string, documentIds: string[], res?: Response) {
    if (!documentIds.length) {
      if (res) {
        res.setHeader('Content-Type', 'application/json')
        return res.status(400).json({ message: 'No documents selected' })
      }
      return { zipUrl: null }
    }
    const docs = await this.prisma.document.findMany({ where: { id: { in: documentIds }, orgId }, include: { client: { select: { name: true } }, task: { select: { title: true } } } })
    if (!docs.length) {
      if (res) {
        res.setHeader('Content-Type', 'application/json')
        return res.status(404).json({ message: 'No documents found' })
      }
      return { zipUrl: null }
    }
    if (!res) {
      return { zipUrl: null }
    }
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename="documents.zip"')
    const createArchive = (archiver as any).default || archiver
    const archive = createArchive('zip', { zlib: { level: 6 } })
    archive.on('error', (err: any) => { throw err })
    archive.pipe(res)
    for (const doc of docs) {
      const content = `${doc.fileName || 'Untitled'}|${doc.category || 'Uncategorized'}|${doc.fileUrl || ''}|${doc.client?.name || '-'}|${doc.task?.title || '-'}|${new Date(doc.createdAt).toLocaleDateString('en-IN')}`
      archive.append(content, { name: `${doc.fileName || 'untitled'}_${doc.id}.txt` })
    }
    await archive.finalize()
  }
}
