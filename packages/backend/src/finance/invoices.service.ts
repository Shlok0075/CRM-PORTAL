import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: any) {
    if (!orgId) throw new BadRequestException('Missing orgId')
    try {
      const cleaned = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== null && v !== undefined)) as any
      let lineItems = cleaned.lineItems || []
      if (typeof lineItems === 'string') {
        try { lineItems = JSON.parse(lineItems) } catch { lineItems = [] }
      }
      const subtotal = this.calculateSubtotal(lineItems)
      const { cgst, sgst, igst } = this.calculateGst(subtotal, cleaned.placeOfSupply)
      const total = subtotal + cgst + sgst + igst

      const itemsWithHsn = lineItems.map((item: any) => ({
        ...item,
        hsnSac: item.hsnSac || cleaned.hsnSac,
      }))

      const invoiceNumber = await this.generateInvoiceNumber(orgId)
      const data: any = {
        org: { connect: { id: orgId } },
        invoiceNumber,
        lineItems: JSON.stringify(itemsWithHsn),
        subtotal,
        cgst,
        sgst,
        igst,
        total,
        status: 'draft',
        issueDate: cleaned.issueDate ? new Date(cleaned.issueDate) : undefined,
        dueDate: cleaned.dueDate ? new Date(cleaned.dueDate) : undefined,
        hsnSac: cleaned.hsnSac,
        placeOfSupply: cleaned.placeOfSupply,
      }
      if (cleaned.clientId) {
        data.client = { connect: { id: cleaned.clientId } }
      }
      if (cleaned.billingProfileId) {
        data.billingProfile = { connect: { id: cleaned.billingProfileId } }
      }

      const invoice = await this.prisma.invoice.create({
        data,
        include: { client: true, billingProfile: true },
      })

      if (itemsWithHsn.length > 0) {
        try {
          await this.prisma.invoiceLineItem.createMany({
            data: itemsWithHsn.map((item: any) => ({
              invoiceId: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              hsnSac: item.hsnSac,
            })),
          })
        } catch (lineItemErr) {
          console.error('[INVOICES] createMany lineItems failed:', lineItemErr)
        }
      }

      return this.prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { lineItemsList: true, client: true, billingProfile: true },
      })
    } catch (err) {
      console.error('[INVOICES] create failed:', err)
      throw err
    }
  }

  async findAll(orgId: string, query: any) {
    const where: any = { orgId }
    if (query.clientId) where.clientId = query.clientId
    if (query.status) where.status = query.status
    if (query.billingProfileId) where.billingProfileId = query.billingProfileId
    if (query.fromDate || query.toDate) {
      where.createdAt = {}
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate)
      if (query.toDate) where.createdAt.lte = new Date(query.toDate)
    }

    try {
      const invoices = await this.prisma.invoice.findMany({
        where: where as any,
        include: { client: { select: { id: true, name: true } }, lineItemsList: true, creditNotes: true, receipts: true },
        orderBy: { createdAt: 'desc' },
      })
      return invoices.map((inv) => ({
        ...inv,
        lineItems: inv.lineItems ? (() => { try { return JSON.parse(inv.lineItems) } catch { return [] } })() : [],
      }))
    } catch (err) {
      console.error('[INVOICES] findAll failed, retrying without receipts/creditNotes:', err)
      const invoices = await this.prisma.invoice.findMany({
        where: where as any,
        include: { client: { select: { id: true, name: true } }, lineItemsList: true },
        orderBy: { createdAt: 'desc' },
      })
      return invoices.map((inv) => ({
        ...inv,
        lineItems: inv.lineItems ? (() => { try { return JSON.parse(inv.lineItems) } catch { return [] } })() : [],
      }))
    }
  }

  async findOne(id: string) {
    try {
      const inv = await this.prisma.invoice.findUnique({
        where: { id },
        include: { client: true, lineItemsList: true, creditNotes: true, receipts: true, billingProfile: true },
      })
      if (!inv) throw new NotFoundException('Invoice not found')
      return {
        ...inv,
        lineItems: inv.lineItems ? (() => { try { return JSON.parse(inv.lineItems) } catch { return [] } })() : [],
      }
    } catch (err) {
      console.error('[INVOICES] findOne failed for id:', id, err)
      throw err
    }
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Invoice not found')

    const updateData: any = { ...dto }
    if (dto.lineItems) {
      const subtotal = this.calculateSubtotal(dto.lineItems)
      const { cgst, sgst, igst } = this.calculateGst(subtotal, dto.placeOfSupply || existing.placeOfSupply)
      updateData.lineItems = JSON.stringify(dto.lineItems)
      updateData.subtotal = subtotal
      updateData.cgst = cgst
      updateData.sgst = sgst
      updateData.igst = igst
      updateData.total = subtotal + cgst + sgst + igst
      if (dto.placeOfSupply) updateData.placeOfSupply = dto.placeOfSupply
      if (dto.hsnSac) updateData.hsnSac = dto.hsnSac
    }

    if (updateData.clientId) {
      updateData.client = { connect: { id: updateData.clientId } }
      delete updateData.clientId
    }
    if (updateData.billingProfileId) {
      updateData.billingProfile = { connect: { id: updateData.billingProfileId } }
      delete updateData.billingProfileId
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { lineItemsList: true, client: true, billingProfile: true },
    })

    if (dto.lineItems) {
      await this.prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } })
      try {
        await this.prisma.invoiceLineItem.createMany({
          data: dto.lineItems.map((item: any) => ({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            hsnSac: item.hsnSac || dto.hsnSac,
          })),
        })
      } catch (lineItemErr) {
        console.error('[INVOICES] update createMany lineItems failed:', lineItemErr)
      }
    }

    return this.prisma.invoice.findUnique({
      where: { id },
      include: { lineItemsList: true, client: true, billingProfile: true },
    })
  }

  async remove(id: string) {
    return this.prisma.invoice.delete({ where: { id } })
  }

  async addLineItem(invoiceId: string, dto: any) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) throw new NotFoundException('Invoice not found')

    const item = await this.prisma.invoiceLineItem.create({
      data: {
        invoiceId,
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        amount: dto.amount,
        hsnSac: dto.hsnSac,
      },
    })

    const currentItems = invoice.lineItems ? (() => { try { return JSON.parse(invoice.lineItems) } catch { return [] } })() : []
    currentItems.push({ ...dto, id: item.id })
    const subtotal = this.calculateSubtotal(currentItems)
    const { cgst, sgst, igst } = this.calculateGst(subtotal, invoice.placeOfSupply)
    const total = subtotal + cgst + sgst + igst

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { lineItems: JSON.stringify(currentItems), subtotal, cgst, sgst, igst, total },
    })

    return item
  }

  async updateLineItem(itemId: string, dto: any) {
    const item = await this.prisma.invoiceLineItem.findUnique({ where: { id: itemId } })
    if (!item) throw new NotFoundException('Line item not found')

    const updated = await this.prisma.invoiceLineItem.update({
      where: { id: itemId },
      data: { description: dto.description, quantity: dto.quantity, unitPrice: dto.unitPrice, amount: dto.amount, hsnSac: dto.hsnSac },
    })

    const invoice = await this.prisma.invoice.findUnique({ where: { id: item.invoiceId } })
    if (invoice) {
      const currentItems = invoice.lineItems ? (() => { try { return JSON.parse(invoice.lineItems) } catch { return [] } })() : []
      const idx = currentItems.findIndex((i: any) => i.id === itemId)
      if (idx >= 0) currentItems[idx] = { ...currentItems[idx], ...dto }
      const subtotal = this.calculateSubtotal(currentItems)
      const { cgst, sgst, igst } = this.calculateGst(subtotal, invoice.placeOfSupply)
      await this.prisma.invoice.update({
        where: { id: item.invoiceId },
        data: { lineItems: JSON.stringify(currentItems), subtotal, cgst, sgst, igst, total: subtotal + cgst + sgst + igst },
      })
    }
    return updated
  }

  async deleteLineItem(itemId: string) {
    const item = await this.prisma.invoiceLineItem.findUnique({ where: { id: itemId } })
    if (!item) throw new NotFoundException('Line item not found')

    await this.prisma.invoiceLineItem.delete({ where: { id: itemId } })

    const invoice = await this.prisma.invoice.findUnique({ where: { id: item.invoiceId } })
    if (invoice) {
      const currentItems = invoice.lineItems ? (() => { try { return JSON.parse(invoice.lineItems) } catch { return [] } })() : []
      const filtered = currentItems.filter((i: any) => i.id !== itemId)
      const subtotal = this.calculateSubtotal(filtered)
      const { cgst, sgst, igst } = this.calculateGst(subtotal, invoice.placeOfSupply)
      await this.prisma.invoice.update({
        where: { id: item.invoiceId },
        data: { lineItems: JSON.stringify(filtered), subtotal, cgst, sgst, igst, total: subtotal + cgst + sgst + igst },
      })
    }
    return { deleted: true }
  }

  async createCreditNote(invoiceId: string, dto: { amount: number; reason?: string }) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) throw new NotFoundException('Invoice not found')
    if (dto.amount > (invoice.total || 0)) throw new BadRequestException('Credit note amount exceeds invoice total')

    return this.prisma.creditNote.create({
      data: { invoiceId, amount: dto.amount, reason: dto.reason, organizationId: invoice.orgId },
    })
  }

  async findCreditNotes(invoiceId: string) {
    return this.prisma.creditNote.findMany({ where: { invoiceId } })
  }

  async createBillingProfile(orgId: string, dto: { name: string; clientIds: string[] }) {
    return this.prisma.billingProfile.create({
      data: { org: { connect: { id: orgId } }, name: dto.name, clientIds: JSON.stringify(dto.clientIds || []) },
    })
  }

  async findBillingProfiles(orgId: string) {
    const profiles = await this.prisma.billingProfile.findMany({ where: { orgId }, include: { invoices: true } })
    return profiles.map((p) => ({ ...p, clientIds: p.clientIds ? (() => { try { return JSON.parse(p.clientIds) } catch { return [] } })() : [] }))
  }

  async findBillingProfile(id: string) {
    const profile = await this.prisma.billingProfile.findUnique({ where: { id }, include: { invoices: true } })
    if (!profile) throw new NotFoundException('Billing profile not found')
    return { ...profile, clientIds: profile.clientIds ? (() => { try { return JSON.parse(profile.clientIds) } catch { return [] } })() : [] }
  }

  async updateBillingProfile(id: string, dto: { name?: string; clientIds?: string[] }) {
    const data: any = {}
    if (dto.name) data.name = dto.name
    if (dto.clientIds) data.clientIds = JSON.stringify(dto.clientIds)
    return this.prisma.billingProfile.update({ where: { id }, data })
  }

  async deleteBillingProfile(id: string) {
    return this.prisma.billingProfile.delete({ where: { id } })
  }

  async outstandingBalances(orgId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { orgId, status: { not: 'paid' } },
      include: { client: { select: { id: true, name: true } }, receipts: true, creditNotes: true },
    })

    const result = invoices.map((inv) => {
      const totalPaid = (inv.receipts || []).reduce((sum: number, r: any) => sum + r.amount, 0)
      const creditNoteTotal = (inv.creditNotes || []).reduce((sum: number, cn: any) => sum + cn.amount, 0)
      const outstanding = (inv.total || 0) - totalPaid - creditNoteTotal
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientId: inv.clientId,
        clientName: inv.client?.name,
        total: inv.total,
        paid: totalPaid,
        creditNotes: creditNoteTotal,
        outstanding,
        dueDate: inv.dueDate,
        status: inv.status,
      }
    })

    return { totalOutstanding: result.reduce((sum, r) => sum + r.outstanding, 0), invoices: result }
  }

  async revenueByClient(orgId: string, query: any) {
    const where: any = { orgId, status: 'paid' }
    if (query.fromDate || query.toDate) {
      where.issueDate = {}
      if (query.fromDate) where.issueDate.gte = new Date(query.fromDate)
      if (query.toDate) where.issueDate.lte = new Date(query.toDate)
    }

    const invoices = await this.prisma.invoice.findMany({
      where: where as any,
      include: { client: { select: { id: true, name: true } } },
    })

    const byClient = new Map<string, { clientId: string; clientName: string; totalRevenue: number; invoiceCount: number }>()
    invoices.forEach((inv) => {
      const key = inv.clientId || 'unknown'
      const name = inv.client?.name || 'Unknown'
      if (!byClient.has(key)) byClient.set(key, { clientId: key, clientName: name, totalRevenue: 0, invoiceCount: 0 })
      byClient.get(key)!.totalRevenue += inv.total || 0
      byClient.get(key)!.invoiceCount += 1
    })

    return { totalRevenue: invoices.reduce((sum, i) => sum + (i.total || 0), 0), byClient: Array.from(byClient.values()) }
  }

  async exportInvoicesCsv(orgId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { orgId },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const rows = [['Invoice Number', 'Client', 'Status', 'Subtotal', 'CGST', 'SGST', 'IGST', 'Total', 'Issue Date', 'Due Date']]
    invoices.forEach((inv) => {
      rows.push([
        inv.invoiceNumber,
        inv.client?.name || '',
        inv.status,
        (inv.subtotal || 0).toFixed(2),
        (inv.cgst || 0).toFixed(2),
        (inv.sgst || 0).toFixed(2),
        (inv.igst || 0).toFixed(2),
        (inv.total || 0).toFixed(2),
        inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : '',
        inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      ])
    })

    return rows.map((r) => r.join(',')).join('\n')
  }

  async exportInvoicesTallyXml(orgId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { orgId },
      include: { client: { select: { name: true } }, lineItemsList: true },
      orderBy: { createdAt: 'desc' },
    })

    const invoiceXml = invoices
      .map(
        (inv) => `    <INVOICE>
      <INVOICENUMBER>${inv.invoiceNumber}</INVOICENUMBER>
      <CLIENT>${inv.client?.name || ''}</CLIENT>
      <DATE>${inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : ''}</DATE>
      <DUEDATE>${inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : ''}</DUEDATE>
      <SUBTOTAL>${inv.subtotal || 0}</SUBTOTAL>
      <CGST>${inv.cgst || 0}</CGST>
      <SGST>${inv.sgst || 0}</SGST>
      <IGST>${inv.igst || 0}</IGST>
      <TOTAL>${inv.total || 0}</TOTAL>
      <STATUS>${inv.status}</STATUS>
      <PLACEOFSUPPLY>${inv.placeOfSupply || ''}</PLACEOFSUPPLY>
      <LINEITEMS>
${inv.lineItemsList.map((li) => `        <ITEM>
          <DESCRIPTION>${li.description}</DESCRIPTION>
          <QUANTITY>${li.quantity || 0}</QUANTITY>
          <UNITPRICE>${li.unitPrice || 0}</UNITPRICE>
          <AMOUNT>${li.amount || 0}</AMOUNT>
          <HSNSAC>${li.hsnSac || ''}</HSNSAC>
        </ITEM>`).join('\n')}
      </LINEITEMS>
    </INVOICE>`
      )
      .join('\n')

    return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
${invoiceXml}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
  }

  private calculateSubtotal(lineItems: any[]): number {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  private calculateGst(subtotal: number, placeOfSupply?: string): { cgst: number; sgst: number; igst: number } {
    const rate = 0.18
    if (placeOfSupply && placeOfSupply.toLowerCase() === 'interstate') {
      const igst = Number((subtotal * rate).toFixed(2))
      return { cgst: 0, sgst: 0, igst }
    }
    const half = Number((subtotal * rate / 2).toFixed(2))
    return { cgst: half, sgst: half, igst: 0 }
  }

  private async generateInvoiceNumber(orgId: string): Promise<string> {
    try {
      const year = new Date().getFullYear()
      const prefix = `INV-${year}-`
      const last = await this.prisma.invoice.findFirst({
        where: { orgId, invoiceNumber: { startsWith: prefix } },
        orderBy: { invoiceNumber: 'desc' },
      })
      let seq = 1
      if (last) {
        const parts = last.invoiceNumber.split('-')
        seq = parseInt(parts[parts.length - 1], 10) + 1
      }
      return `${prefix}${String(seq).padStart(4, '0')}`
    } catch (err) {
      console.error('[INVOICES] generateInvoiceNumber failed:', err)
      throw err
    }
  }
}
