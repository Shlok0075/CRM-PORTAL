export class CreateDocumentDto {
  clientId?: string
  taskId?: string
  category!: string
  fileUrl!: string
  fileName?: string
  fileType?: string
  fileSize?: number
  isPublic?: boolean
  uploadedBy?: string
  uploadedByType?: string
}
