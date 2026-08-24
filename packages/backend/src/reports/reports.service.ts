import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async pipelineSummary(orgId: string) {
    const total = await this.prisma.application.count({ where: { orgId } })
    const byStatus = await this.prisma.application.groupBy({ by: ['status'], where: { orgId }, _count: { status: true } })
    return { total, byStatus }
  }

  async mentorEngagement(orgId: string) {
    const sessions = await this.prisma.mentorSessionLog.findMany({ where: { mentor: { user: { orgId } } }, take: 100 })
    return { sessionsCount: sessions.length }
  }

  async taskReport(orgId: string, query: any) {
    const where: any = { orgId }

    if (query.client) {
      if (Array.isArray(query.client)) where.clientId = { in: query.client }
      else where.clientId = query.client
    }
    if (query.serviceType) where.serviceType = query.serviceType
    if (query.status) where.status = query.status
    if (query.assignee) {
      const assigneeId = Array.isArray(query.assignee) ? query.assignee[0] : query.assignee
      where.assigneeIds = assigneeId
    }

    const dateField = query.dateField === 'targetDate' ? 'targetDate' : 'dueDate'
    if (query.from || query.to) {
      where[dateField] = {}
      if (query.from) where[dateField].gte = new Date(query.from)
      if (query.to) where[dateField].lte = new Date(query.to)
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const total = tasks.length
    const byStatus = new Map<string, { status: string; count: number }>()
    const byClient = new Map<string, { clientId: string; clientName: string; count: number }>()
    const byServiceType = new Map<string, { serviceType: string; count: number }>()

    tasks.forEach((t) => {
      const s = t.status || 'unknown'
      byStatus.set(s, { status: s, count: (byStatus.get(s)?.count || 0) + 1 })

      const cid = t.clientId || 'unassigned'
      const cname = t.client?.name || 'Unassigned'
      byClient.set(cid, { clientId: cid, clientName: cname, count: (byClient.get(cid)?.count || 0) + 1 })

      const st = t.serviceType || 'unspecified'
      byServiceType.set(st, { serviceType: st, count: (byServiceType.get(st)?.count || 0) + 1 })
    })

    return {
      total,
      completionRate: total > 0 ? Math.round((tasks.filter((t) => t.status === 'completed' || t.status === 'verified').length / total) * 100) : 0,
      byStatus: Array.from(byStatus.values()),
      byClient: Array.from(byClient.values()),
      byServiceType: Array.from(byServiceType.values()),
      tasks: tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, clientName: t.client?.name, serviceType: t.serviceType, dueDate: t.dueDate, targetDate: t.targetDate, isOverdue: t.isOverdue })),
    }
  }

  taskReportCsv(data: any) {
    const rows = [['ID', 'Title', 'Status', 'Client', 'Service Type', 'Due Date', 'Target Date', 'Overdue']]
    data.tasks.forEach((t: any) => {
      rows.push([t.id, t.title, t.status, t.clientName || '', t.serviceType || '', t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '', t.targetDate ? new Date(t.targetDate).toISOString().split('T')[0] : '', String(t.isOverdue)])
    })
    return rows.map((r) => r.join(',')).join('\n')
  }

  async timeReport(orgId: string, query: any) {
    const where: any = { orgId }

    if (query.from || query.to) {
      where.startTime = {}
      if (query.from) where.startTime.gte = new Date(query.from)
      if (query.to) where.startTime.lte = new Date(query.to)
    }
    if (query.taskId) where.taskId = query.taskId

    const logs = await this.prisma.taskTimeLog.findMany({
      where,
      include: { task: { select: { title: true, clientId: true } }, user: { select: { id: true, name: true, email: true } } },
      orderBy: { startTime: 'desc' },
    })

    const clientIds = [...new Set(logs.map((l) => l.task?.clientId).filter(Boolean))]
    const clients = clientIds.length > 0 ? await this.prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } }) : []
    const clientMap = new Map(clients.map((c) => [c.id, c.name]))

    const clientWise = new Map<string, { clientId: string; clientName: string; totalMinutes: number; logs: number }>()
    const userWise = new Map<string, { userId: string; userName: string; userEmail: string; totalMinutes: number; logs: number }>()

    logs.forEach((l) => {
      const cid = l.task?.clientId || 'unknown'
      const cname = clientMap.get(cid) || 'Unknown'
      clientWise.set(cid, { clientId: cid, clientName: cname, totalMinutes: (clientWise.get(cid)?.totalMinutes || 0) + (l.durationMinutes || 0), logs: (clientWise.get(cid)?.logs || 0) + 1 })

      const uid = l.userId || 'unknown'
      userWise.set(uid, { userId: uid, userName: l.user?.name || 'Unknown', userEmail: l.user?.email || '', totalMinutes: (userWise.get(uid)?.totalMinutes || 0) + (l.durationMinutes || 0), logs: (userWise.get(uid)?.logs || 0) + 1 })
    })

    return {
      totalMinutes: logs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0),
      totalLogs: logs.length,
      raw: logs.map((l) => ({ id: l.id, taskId: l.taskId, taskTitle: l.task?.title, userId: l.userId, userName: l.user?.name, startTime: l.startTime, endTime: l.endTime, durationMinutes: l.durationMinutes })),
      byClient: Array.from(clientWise.values()),
      byUser: Array.from(userWise.values()),
    }
  }

  timeReportCsv(data: any) {
    const rows = [['ID', 'Task ID', 'Task Title', 'User ID', 'User Name', 'Start Time', 'End Time', 'Duration (min)']]
    data.raw.forEach((r: any) => {
      rows.push([r.id, r.taskId, r.taskTitle || '', r.userId || '', r.userName || '', r.startTime ? new Date(r.startTime).toISOString() : '', r.endTime ? new Date(r.endTime).toISOString() : '', String(r.durationMinutes || 0)])
    })
    return rows.map((r) => r.join(',')).join('\n')
  }

  async attendanceReport(orgId: string, query: any) {
    const where: any = { orgId }

    if (query.from || query.to) {
      where.date = {}
      if (query.from) where.date.gte = new Date(query.from)
      if (query.to) where.date.lte = new Date(query.to)
    }
    if (query.userId) where.userId = query.userId

    const records = await this.prisma.attendance.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { date: 'desc' },
    })

    const byUser = new Map<string, { userId: string; userName: string; userEmail: string; present: number; absent: number; total: number }>()

    records.forEach((r) => {
      const key = r.userId
      if (!byUser.has(key)) byUser.set(key, { userId: key, userName: r.user?.name || 'Unknown', userEmail: r.user?.email || '', present: 0, absent: 0, total: 0 })
      const entry = byUser.get(key)!
      entry.total += 1
      if (r.status === 'present') entry.present += 1
      else entry.absent += 1
    })

    return {
      totalRecords: records.length,
      byUser: Array.from(byUser.values()),
      records: records.map((r) => ({ id: r.id, userId: r.userId, userName: r.user?.name, userEmail: r.user?.email, date: r.date, inTime: r.inTime, outTime: r.outTime, status: r.status })),
    }
  }

  attendanceReportCsv(data: any) {
    const rows = [['ID', 'User ID', 'User Name', 'Email', 'Date', 'In Time', 'Out Time', 'Status']]
    data.records.forEach((r: any) => {
      rows.push([r.id, r.userId, r.userName || '', r.userEmail || '', r.date ? new Date(r.date).toISOString().split('T')[0] : '', r.inTime ? new Date(r.inTime).toISOString() : '', r.outTime ? new Date(r.outTime).toISOString() : '', r.status])
    })
    return rows.map((r) => r.join(',')).join('\n')
  }

  async clientReport(orgId: string, query: any) {
    const where: any = { orgId }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { pan: { contains: query.search, mode: 'insensitive' } },
        { gstins: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    if (query.status) where.status = query.status

    const clients = await this.prisma.client.findMany({
      where,
      include: { group: true, responsibleUser: { select: { name: true, email: true } }, dscRecords: true },
      orderBy: { createdAt: 'desc' },
    })

    return {
      count: clients.length,
      clients: clients.map((c) => ({ id: c.id, name: c.name, pan: c.pan, gstins: c.gstins, type: c.type, status: c.status, group: c.group?.name, createdAt: c.createdAt, dscCount: c.dscRecords.length })),
    }
  }

  clientReportCsv(data: any) {
    const rows = [['ID', 'Name', 'PAN', 'GSTINs', 'Type', 'Status', 'Group', 'Created At', 'DSC Count']]
    data.clients.forEach((c: any) => {
      rows.push([c.id, c.name, c.pan || '', c.gstins || '', c.type || '', c.status, c.group || '', c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '', String(c.dscCount || 0)])
    })
    return rows.map((r) => r.join(',')).join('\n')
  }

  async dscExpiryReport(orgId: string) {
    const clients = await this.prisma.client.findMany({ where: { orgId }, select: { id: true } })
    const clientIds = clients.map((c) => c.id)

    const records = await this.prisma.dscRecord.findMany({
      where: { clientId: { in: clientIds } },
      include: { client: { select: { name: true } } },
      orderBy: { expiryDate: 'asc' },
    })

    const now = new Date()
    const thirtyDays = new Date()
    thirtyDays.setDate(now.getDate() + 30)
    const ninetyDays = new Date()
    ninetyDays.setDate(now.getDate() + 90)

    return {
      total: records.length,
      expired: records.filter((r) => r.expiryDate < now).length,
      expiringWithin30Days: records.filter((r) => r.expiryDate >= now && r.expiryDate <= thirtyDays).length,
      expiringWithin90Days: records.filter((r) => r.expiryDate >= now && r.expiryDate <= ninetyDays).length,
      records: records.map((r) => ({ id: r.id, clientId: r.clientId, clientName: r.client?.name, holderName: r.holderName, dscClass: r.dscClass, expiryDate: r.expiryDate, custodyStatus: r.custodyStatus })),
    }
  }

  dscReportCsv(data: any) {
    const rows = [['ID', 'Client ID', 'Client Name', 'Holder Name', 'DSC Class', 'Expiry Date', 'Custody Status']]
    data.records.forEach((r: any) => {
      rows.push([r.id, r.clientId, r.clientName || '', r.holderName, r.dscClass, r.expiryDate ? new Date(r.expiryDate).toISOString().split('T')[0] : '', r.custodyStatus])
    })
    return rows.map((r) => r.join(',')).join('\n')
  }

  async financialReport(orgId: string, query: any) {
    const invoiceWhere: any = { orgId }
    if (query.from || query.to) {
      invoiceWhere.issueDate = {}
      if (query.from) invoiceWhere.issueDate.gte = new Date(query.from)
      if (query.to) invoiceWhere.issueDate.lte = new Date(query.to)
    }

    const invoices = await this.prisma.invoice.findMany({
      where: invoiceWhere,
      include: { client: { select: { name: true } }, receipts: true, creditNotes: true },
    })

    const receiptsWhere: any = { organizationId: orgId }
    if (query.from || query.to) {
      receiptsWhere.date = {}
      if (query.from) receiptsWhere.date.gte = new Date(query.from)
      if (query.to) receiptsWhere.date.lte = new Date(query.to)
    }

    const receipts = await this.prisma.receipt.findMany({ where: receiptsWhere, include: { client: { select: { name: true } }, invoice: { select: { invoiceNumber: true } } } })

    const expenseWhere: any = { orgId }
    if (query.from || query.to) {
      expenseWhere.date = {}
      if (query.from) expenseWhere.date.gte = new Date(query.from)
      if (query.to) expenseWhere.date.lte = new Date(query.to)
    }

    const expenses = await this.prisma.expense.findMany({ where: expenseWhere, include: { client: { select: { name: true } }, category: true } })

    const outstanding = invoices
      .map((inv) => {
        const totalPaid = (inv.receipts || []).reduce((sum, r) => sum + r.amount, 0)
        const creditTotal = (inv.creditNotes || []).reduce((sum, cn) => sum + cn.amount, 0)
        const outstandingAmount = (inv.total || 0) - totalPaid - creditTotal
        return {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client?.name,
          total: inv.total,
          paid: totalPaid,
          creditNotes: creditTotal,
          outstanding: outstandingAmount,
          dueDate: inv.dueDate,
          status: inv.status,
        }
      })
      .filter((o) => o.outstanding > 0)

    return {
      invoices: {
        count: invoices.length,
        totalAmount: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
        byStatus: this.groupByField(invoices, 'status'),
      },
      receipts: {
        count: receipts.length,
        totalAmount: receipts.reduce((sum, r) => sum + r.amount, 0),
        byMode: this.groupByField(receipts, 'mode'),
      },
      expenses: {
        count: expenses.length,
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        billable: expenses.filter((e) => e.isBillable).reduce((sum, e) => sum + e.amount, 0),
        byCategory: this.groupExpensesByCategory(expenses),
      },
      outstanding: {
        count: outstanding.length,
        totalAmount: outstanding.reduce((sum, o) => sum + o.outstanding, 0),
        invoices: outstanding,
      },
    }
  }

  financialReportCsv(data: any) {
    const rows = [['Section', 'ID / Invoice Number', 'Client / Mode / Category', 'Amount', 'Status / Date', 'Outstanding']]
    data.invoices.invoices.forEach((inv: any) => {
      rows.push(['Invoice', inv.invoiceNumber, inv.clientName || '', String(inv.total || 0), inv.status || '', ''])
    })
    data.receipts.receipts.forEach((r: any) => {
      rows.push(['Receipt', r.id, r.client?.name || r.mode || '', String(r.amount), r.mode, ''])
    })
    data.expenses.expenses.forEach((e: any) => {
      rows.push(['Expense', e.id, e.client?.name || e.category?.name || '', String(e.amount), e.isBillable ? 'Billable' : 'Non-Billable', ''])
    })
    data.outstanding.invoices.forEach((o: any) => {
      rows.push(['Outstanding', o.invoiceNumber, o.clientName || '', String(o.total || 0), o.status || '', String(o.outstanding)])
    })
    return rows.map((r) => r.join(',')).join('\n')
  }

  async documentReport(orgId: string, query: any) {
    const pendingRequests = await this.prisma.taskDocumentRequest.findMany({
      where: { orgId, status: 'pending' },
      include: { task: { select: { title: true } }, client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const inOutWhere: any = { orgId }
    if (query.from || query.to) {
      inOutWhere.date = {}
      if (query.from) inOutWhere.date.gte = new Date(query.from)
      if (query.to) inOutWhere.date.lte = new Date(query.to)
    }

    const inOutLogs = await this.prisma.documentInOutLog.findMany({
      where: inOutWhere,
      include: { client: { select: { name: true } } },
      orderBy: { date: 'desc' },
    })

    const outstanding = inOutLogs.filter((l) => l.direction === 'out' && l.returnable && l.status !== 'returned')

    return {
      pendingRequests: pendingRequests.map((r) => ({ id: r.id, taskId: r.taskId, taskTitle: r.task?.title, clientId: r.clientId, clientName: r.client?.name, documentName: r.documentName, category: r.category, status: r.status, createdAt: r.createdAt })),
      inOutLogs: inOutLogs.map((l) => ({ id: l.id, clientId: l.clientId, clientName: l.client?.name, direction: l.direction, itemName: l.itemName, status: l.status, date: l.date, returnable: l.returnable })),
      outstandingRegister: outstanding.map((l) => ({ id: l.id, clientId: l.clientId, clientName: l.client?.name, itemName: l.itemName, date: l.date, status: l.status, returnable: l.returnable })),
    }
  }

  documentReportCsv(data: any) {
    const rows = [['Section', 'ID', 'Task / Client / Item', 'Name / Direction', 'Status', 'Date', 'Returnable']]
    data.pendingRequests.forEach((r: any) => {
      rows.push(['Pending Request', r.id, r.taskTitle || '', r.documentName, r.status, r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '', ''])
    })
    data.inOutLogs.forEach((l: any) => {
      rows.push(['In/Out Log', l.id, l.clientName || '', l.itemName, l.direction + ' - ' + l.status, l.date ? new Date(l.date).toISOString().split('T')[0] : '', String(l.returnable)])
    })
    data.outstandingRegister.forEach((l: any) => {
      rows.push(['Outstanding', l.id, l.clientName || '', l.itemName, l.status, l.date ? new Date(l.date).toISOString().split('T')[0] : '', String(l.returnable)])
    })
    return rows.map((r) => r.join(',')).join('\n')
  }

  async complianceReport(orgId: string, query: any) {
    const entries = await this.prisma.complianceCalendarEntry.findMany({ where: { orgId }, orderBy: { name: 'asc' } })

    const result = []
    for (const entry of entries) {
      const applicableTo = entry.applicableTo
      const tasks = await this.prisma.task.findMany({
        where: { orgId, serviceType: applicableTo },
        select: { id: true, title: true, status: true, dueDate: true, targetDate: true, updatedAt: true },
      })

      let onTime = 0
      let late = 0
      let pending = 0

      const parsedDueDate = this.parseDueDateRule(entry.dueDateRule)

      tasks.forEach((t) => {
        const completed = t.status === 'completed' || t.status === 'verified'
        if (completed) {
          const completedDate = t.updatedAt ? new Date(t.updatedAt) : new Date()
          if (parsedDueDate && completedDate <= parsedDueDate) onTime += 1
          else late += 1
        } else {
          pending += 1
        }
      })

      result.push({
        entryId: entry.id,
        entryName: entry.name,
        applicableTo,
        dueDateRule: entry.dueDateRule,
        dueDate: parsedDueDate,
        totalTasks: tasks.length,
        onTime,
        late,
        pending,
        adherenceRate: tasks.length > 0 ? Math.round((onTime / tasks.length) * 100) : 0,
      })
    }

    return { entries: result }
  }

  complianceReportCsv(data: any) {
    const rows = [['Entry ID', 'Entry Name', 'Applicable To', 'Due Date', 'Total Tasks', 'On Time', 'Late', 'Pending', 'Adherence Rate %']]
    data.entries.forEach((e: any) => {
      rows.push([e.entryId, e.entryName, e.applicableTo, e.dueDate ? new Date(e.dueDate).toISOString().split('T')[0] : '', String(e.totalTasks), String(e.onTime), String(e.late), String(e.pending), String(e.adherenceRate)])
    })
    return rows.map((r) => r.join(',')).join('\n')
  }

  async unbilledReport(orgId: string, query: any) {
    const where: any = { orgId, status: { in: ['completed', 'verified'] } }

    if (query.serviceType) where.serviceType = query.serviceType
    if (query.client) {
      if (Array.isArray(query.client)) where.clientId = { in: query.client }
      else where.clientId = query.client
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    })

    const clientIds = [...new Set(tasks.map((t) => t.clientId).filter(Boolean))]

    const recentInvoices = clientIds.length > 0
      ? await this.prisma.invoice.findMany({
          where: { orgId, clientId: { in: clientIds }, issueDate: { gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) } },
          select: { clientId: true, total: true, issueDate: true },
        })
      : []

    const invoiceMap = new Map<string, { count: number; total: number }>()
    recentInvoices.forEach((inv) => {
      const key = inv.clientId!
      invoiceMap.set(key, { count: (invoiceMap.get(key)?.count || 0) + 1, total: (invoiceMap.get(key)?.total || 0) + (inv.total || 0) })
    })

    return {
      totalUnbilled: tasks.length,
      estimatedRevenueLeakage: tasks.length * 0,
      tasks: tasks.map((t) => {
        const invoiceData = invoiceMap.get(t.clientId!) || { count: 0, total: 0 }
        return {
          id: t.id,
          title: t.title,
          clientId: t.clientId,
          clientName: t.client?.name,
          serviceType: t.serviceType,
          status: t.status,
          updatedAt: t.updatedAt,
          hasRecentInvoice: invoiceData.count > 0,
          recentInvoiceTotal: invoiceData.total,
        }
      }),
    }
  }

  unbilledReportCsv(data: any) {
    const rows = [['ID', 'Title', 'Client ID', 'Client Name', 'Service Type', 'Status', 'Updated At', 'Has Recent Invoice', 'Recent Invoice Total']]
    data.tasks.forEach((t: any) => {
      rows.push([t.id, t.title, t.clientId || '', t.clientName || '', t.serviceType || '', t.status, t.updatedAt ? new Date(t.updatedAt).toISOString().split('T')[0] : '', String(t.hasRecentInvoice), String(t.recentInvoiceTotal || 0)])
    })
    return rows.map((r) => r.join(',')).join('\n')
  }

  private groupByField(items: any[], field: string) {
    const map = new Map<string, number>()
    items.forEach((item) => {
      const val = item[field] || 'unknown'
      map.set(val, (map.get(val) || 0) + 1)
    })
    return Array.from(map.entries()).map(([key, count]) => ({ [field]: key, count }))
  }

  private groupExpensesByCategory(expenses: any[]) {
    const map = new Map<string, { categoryId: string; categoryName: string; total: number }>()
    expenses.forEach((e) => {
      const key = e.categoryId || 'uncategorized'
      const name = e.category?.name || 'Uncategorized'
      if (!map.has(key)) map.set(key, { categoryId: key, categoryName: name, total: 0 })
      map.get(key)!.total += e.amount
    })
    return Array.from(map.values())
  }

  private parseDueDateRule(rule: string): Date | null {
    const candidates = rule.match(/\d{4}-\d{2}-\d{2}/)
    return candidates ? new Date(candidates[0]) : null
  }

  taskReportPdf(data: any) {
    const { PDFDocument } = require('pdfkit')
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {})
    doc.fontSize(16).text('Task Report', { align: 'center' }).moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`).moveDown()
    if (data.tasks?.length) {
      data.tasks.forEach((t: any, i: number) => {
        doc.text(`${i + 1}. ${t.title || 'Untitled'} | Client: ${t.clientName || '-'} | Status: ${t.status} | Updated: ${t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('en-IN') : '-'}`)
      })
    }
    doc.end()
    return Buffer.concat(chunks)
  }

  timeReportPdf(data: any) {
    const { PDFDocument } = require('pdfkit')
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {})
    doc.fontSize(16).text('Time Report', { align: 'center' }).moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`).moveDown()
    if (data.logs?.length) {
      data.logs.forEach((l: any, i: number) => {
        doc.text(`${i + 1}. ${l.taskTitle || '-'} | User: ${l.userName || '-'} | Duration: ${l.durationMinutes || 0} min | Date: ${l.startTime ? new Date(l.startTime).toLocaleDateString('en-IN') : '-'}`)
      })
    }
    doc.end()
    return Buffer.concat(chunks)
  }

  attendanceReportPdf(data: any) {
    const { PDFDocument } = require('pdfkit')
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {})
    doc.fontSize(16).text('Attendance Report', { align: 'center' }).moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`).moveDown()
    if (data.records?.length) {
      data.records.forEach((r: any, i: number) => {
        doc.text(`${i + 1}. ${r.userName || '-'} | Date: ${r.date ? new Date(r.date).toLocaleDateString('en-IN') : '-'} | Status: ${r.status || '-'}`)
      })
    }
    doc.end()
    return Buffer.concat(chunks)
  }

  clientReportPdf(data: any) {
    const { PDFDocument } = require('pdfkit')
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {})
    doc.fontSize(16).text('Client Report', { align: 'center' }).moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`).moveDown()
    if (data.clients?.length) {
      data.clients.forEach((c: any, i: number) => {
        doc.text(`${i + 1}. ${c.name || '-'} | PAN: ${c.pan || '-'} | GSTIN: ${c.gstins || '-'} | Status: ${c.status || '-'}`)
      })
    }
    doc.end()
    return Buffer.concat(chunks)
  }

  dscReportPdf(data: any) {
    const { PDFDocument } = require('pdfkit')
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {})
    doc.fontSize(16).text('DSC Report', { align: 'center' }).moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`).moveDown()
    if (data.records?.length) {
      data.records.forEach((r: any, i: number) => {
        doc.text(`${i + 1}. ${r.clientName || '-'} | Holder: ${r.holderName || '-'} | Class: ${r.dscClass || '-'} | Expiry: ${r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('en-IN') : '-'} | Status: ${r.custodyStatus || '-'}`)
      })
    }
    doc.end()
    return Buffer.concat(chunks)
  }

  financialReportPdf(data: any) {
    const { PDFDocument } = require('pdfkit')
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {})
    doc.fontSize(16).text('Financial Report', { align: 'center' }).moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`).moveDown()
    if (data.invoices?.length) {
      doc.text('Invoices:').moveDown()
      data.invoices.forEach((inv: any, i: number) => {
        doc.text(`${i + 1}. ${inv.invoiceNumber || '-'} | Client: ${inv.clientName || '-'} | Total: ${inv.total || 0} | Status: ${inv.status || '-'}`)
      })
      doc.moveDown()
    }
    if (data.expenses?.length) {
      doc.text('Expenses:').moveDown()
      data.expenses.forEach((exp: any, i: number) => {
        doc.text(`${i + 1}. ${exp.categoryName || '-'} | Amount: ${exp.amount || 0} | Billable: ${exp.isBillable ? 'Yes' : 'No'}`)
      })
    }
    doc.end()
    return Buffer.concat(chunks)
  }

  documentReportPdf(data: any) {
    const { PDFDocument } = require('pdfkit')
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {})
    doc.fontSize(16).text('Document Report', { align: 'center' }).moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`).moveDown()
    if (data.documents?.length) {
      data.documents.forEach((d: any, i: number) => {
        doc.text(`${i + 1}. ${d.fileName || '-'} | Category: ${d.category || '-'} | Client: ${d.clientName || '-'} | Task: ${d.taskTitle || '-'}`)
      })
    }
    doc.end()
    return Buffer.concat(chunks)
  }

  complianceReportPdf(data: any) {
    const { PDFDocument } = require('pdfkit')
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {})
    doc.fontSize(16).text('Compliance Report', { align: 'center' }).moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`).moveDown()
    if (data.entries?.length) {
      data.entries.forEach((e: any, i: number) => {
        doc.text(`${i + 1}. ${e.entryName || '-'} | Applicable: ${e.applicableTo || '-'} | On Time: ${e.onTime || 0} | Late: ${e.late || 0} | Pending: ${e.pending || 0} | Adherence: ${e.adherenceRate || 0}%`)
      })
    }
    doc.end()
    return Buffer.concat(chunks)
  }

  unbilledReportPdf(data: any) {
    const { PDFDocument } = require('pdfkit')
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {})
    doc.fontSize(16).text('Unbilled Report', { align: 'center' }).moveDown()
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('en-IN')}`).moveDown()
    if (data.tasks?.length) {
      data.tasks.forEach((t: any, i: number) => {
        doc.text(`${i + 1}. ${t.title || '-'} | Client: ${t.clientName || '-'} | Status: ${t.status || '-'}`)
      })
    }
    doc.end()
    return Buffer.concat(chunks)
  }
}
