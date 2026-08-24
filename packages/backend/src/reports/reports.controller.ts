import { Controller, Get, Req, UseGuards, Query, Res, Header } from '@nestjs/common'
import { Response } from 'express'
import { ReportsService } from './reports.service'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  private orgId(req: any) {
    return req.user?.orgId
  }

  @UseGuards(JwtGuard)
  @Get('pipeline')
  pipeline(@Req() req: any) {
    return this.svc.pipelineSummary(this.orgId(req))
  }

  @UseGuards(JwtGuard)
  @Get('mentors')
  mentors(@Req() req: any) {
    return this.svc.mentorEngagement(this.orgId(req))
  }

  @UseGuards(JwtGuard)
  @Get('tasks')
  async taskReport(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res?: Response) {
    const orgId = this.orgId(req)
    const data = await this.svc.taskReport(orgId, query)
    if (query.export === 'csv') {
      const csv = this.svc.taskReportCsv(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=task-report.csv')
      return res.send(csv)
    }
    if (query.export === 'pdf') {
      const pdf = this.svc.taskReportPdf(data)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=task-report.pdf')
      return res.send(pdf)
    }
    return data
  }

  @UseGuards(JwtGuard)
  @Get('time')
  async timeReport(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res?: Response) {
    const orgId = this.orgId(req)
    const data = await this.svc.timeReport(orgId, query)
    if (query.export === 'csv') {
      const csv = this.svc.timeReportCsv(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=time-report.csv')
      return res.send(csv)
    }
    if (query.export === 'pdf') {
      const pdf = this.svc.timeReportPdf(data)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=time-report.pdf')
      return res.send(pdf)
    }
    return data
  }

  @UseGuards(JwtGuard)
  @Get('attendance')
  async attendanceReport(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res?: Response) {
    const orgId = this.orgId(req)
    const data = await this.svc.attendanceReport(orgId, query)
    if (query.export === 'csv') {
      const csv = this.svc.attendanceReportCsv(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv')
      return res.send(csv)
    }
    if (query.export === 'pdf') {
      const pdf = this.svc.attendanceReportPdf(data)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf')
      return res.send(pdf)
    }
    return data
  }

  @UseGuards(JwtGuard)
  @Get('clients')
  async clientReport(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res?: Response) {
    const orgId = this.orgId(req)
    const data = await this.svc.clientReport(orgId, query)
    if (query.export === 'csv') {
      const csv = query.type === 'dsc' ? this.svc.dscReportCsv(data) : this.svc.clientReportCsv(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=${query.type === 'dsc' ? 'dsc-report.csv' : 'client-report.csv'}`)
      return res.send(csv)
    }
    if (query.export === 'pdf') {
      const pdf = query.type === 'dsc' ? this.svc.dscReportPdf(data) : this.svc.clientReportPdf(data)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=${query.type === 'dsc' ? 'dsc-report.pdf' : 'client-report.pdf'}`)
      return res.send(pdf)
    }
    return data
  }

  @UseGuards(JwtGuard)
  @Get('financial')
  async financialReport(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res?: Response) {
    const orgId = this.orgId(req)
    const data = await this.svc.financialReport(orgId, query)
    if (query.export === 'csv') {
      const csv = this.svc.financialReportCsv(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=financial-report.csv')
      return res.send(csv)
    }
    if (query.export === 'pdf') {
      const pdf = this.svc.financialReportPdf(data)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=financial-report.pdf')
      return res.send(pdf)
    }
    return data
  }

  @UseGuards(JwtGuard)
  @Get('documents')
  async documentReport(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res?: Response) {
    const orgId = this.orgId(req)
    const data = await this.svc.documentReport(orgId, query)
    if (query.export === 'csv') {
      const csv = this.svc.documentReportCsv(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=document-report.csv')
      return res.send(csv)
    }
    if (query.export === 'pdf') {
      const pdf = this.svc.documentReportPdf(data)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=document-report.pdf')
      return res.send(pdf)
    }
    return data
  }

  @UseGuards(JwtGuard)
  @Get('compliance')
  async complianceReport(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res?: Response) {
    const orgId = this.orgId(req)
    const data = await this.svc.complianceReport(orgId, query)
    if (query.export === 'csv') {
      const csv = this.svc.complianceReportCsv(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=compliance-report.csv')
      return res.send(csv)
    }
    if (query.export === 'pdf') {
      const pdf = this.svc.complianceReportPdf(data)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=compliance-report.pdf')
      return res.send(pdf)
    }
    return data
  }

  @UseGuards(JwtGuard)
  @Get('unbilled')
  async unbilledReport(@Req() req: any, @Query() query: any, @Res({ passthrough: true }) res?: Response) {
    const orgId = this.orgId(req)
    const data = await this.svc.unbilledReport(orgId, query)
    if (query.export === 'csv') {
      const csv = this.svc.unbilledReportCsv(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=unbilled-report.csv')
      return res.send(csv)
    }
    if (query.export === 'pdf') {
      const pdf = this.svc.unbilledReportPdf(data)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=unbilled-report.pdf')
      return res.send(pdf)
    }
    return data
  }
}
