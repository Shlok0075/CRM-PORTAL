import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const org = await prisma.organization.upsert({
    where: { domain: 'local.ca-firm' },
    update: {},
    create: {
      name: 'Local CA Firm',
      domain: 'local.ca-firm',
    },
  })

  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@ca-firm.local', orgId: org.id },
    select: { id: true },
  })

  if (existingAdmin) {
    console.log('Database already seeded, skipping.')
    return
  }

  const password = 'adminpass'
  const hash = await bcrypt.hash(password, 10)

  const role = await prisma.role.create({
    data: {
      org: { connect: { id: org.id } },
      name: 'Super Admin',
      permissions: JSON.stringify(['*']),
    },
  })

  const user = await prisma.user.create({
    data: {
      org: { connect: { id: org.id } },
      email: 'admin@ca-firm.local',
      name: 'CA Admin',
      passwordHash: hash,
      roleId: role.id,
      isActive: true,
    },
  })

  const client1 = await prisma.client.create({
    data: {
      org: { connect: { id: org.id } },
      name: 'Acme Industries Pvt Ltd',
      pan: 'AACCA1234F',
      gstins: JSON.stringify(['27AACCA1234F1Z5']),
      type: 'company',
      status: 'active',
      responsibleUserId: user.id,
    },
  })

  const client2 = await prisma.client.create({
    data: {
      org: { connect: { id: org.id } },
      name: 'Beta Technologies',
      pan: 'AABBT5678G',
      gstins: JSON.stringify(['27AABBT5678G1Z3']),
      type: 'company',
      status: 'active',
      responsibleUserId: user.id,
    },
  })

  await prisma.clientGroup.create({
    data: {
      org: { connect: { id: org.id } },
      name: 'Key Accounts',
    },
  })

  await prisma.service.create({
    data: {
      org: { connect: { id: org.id } },
      name: 'GST Return Filing',
      defaultPrice: 3000,
    },
  })

  await prisma.service.create({
    data: {
      org: { connect: { id: org.id } },
      name: 'Income Tax Return',
      defaultPrice: 5000,
    },
  })

  await prisma.package.create({
    data: {
      org: { connect: { id: org.id } },
      name: 'GST + ITR Combo',
      serviceIds: JSON.stringify(['1', '2']),
      price: 7000,
    },
  })

  await prisma.retainer.create({
    data: {
      org: { connect: { id: org.id } },
      clientId: client1.id,
      packageIds: JSON.stringify(['1']),
      totalAmount: 36000,
      billingFrequency: 'monthly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      status: 'active',
    },
  })

  await prisma.task.create({
    data: {
      org: { connect: { id: org.id } },
      clientId: client1.id,
      title: 'File GSTR-3B for July 2026',
      description: 'Monthly GSTR-3B filing for Acme Industries',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      assigneeIds: user.id,
      tags: JSON.stringify(['gst', 'monthly']),
      priority: 'high',
      serviceType: 'GST Return Filing',
      isOverdue: false,
    },
  })

  await prisma.task.create({
    data: {
      org: { connect: { id: org.id } },
      clientId: client2.id,
      title: 'File ITR for FY 2025-26',
      description: 'Income tax return filing for Beta Technologies',
      status: 'not_started',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      assigneeIds: user.id,
      tags: JSON.stringify(['itr', 'annual']),
      priority: 'medium',
      serviceType: 'Income Tax Return',
      isOverdue: false,
    },
  })

  await prisma.invoice.create({
    data: {
      org: { connect: { id: org.id } },
      clientId: client1.id,
      invoiceNumber: 'INV-001',
      lineItems: JSON.stringify([{ description: 'GST Return Filing', quantity: 1, unitPrice: 3000, amount: 3000 }]),
      subtotal: 3000,
      cgst: 150,
      sgst: 150,
      total: 3300,
      status: 'sent',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.complianceCalendarEntry.create({
    data: {
      org: { connect: { id: org.id } },
      name: 'GSTR-3B',
      applicableTo: 'all-gst-clients',
      dueDateRule: '20th of next month',
    },
  })

  await prisma.complianceCalendarEntry.create({
    data: {
      org: { connect: { id: org.id } },
      name: 'GSTR-1',
      applicableTo: 'all-gst-clients',
      dueDateRule: '11th of next month',
    },
  })

  await prisma.messageTemplate.create({
    data: {
      org: { connect: { id: org.id } },
      channel: 'email',
      name: 'Payment Reminder',
      body: 'Dear {client_name}, your invoice {invoice_number} is due on {due_date}.',
    },
  })

  console.log('Seeded:', { org: org.id, user: user.email, password, clients: [client1.name, client2.name] })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
