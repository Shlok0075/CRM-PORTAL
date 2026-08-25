import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query, Res, Header } from '@nestjs/common'
import { Response } from 'express'
import * as XLSX from 'xlsx'
import { EmployeesService } from './employees.service'
import { CreateEmployeeDto } from './dto/create-employee.dto'
import { MarkAttendanceDto } from './dto/mark-attendance.dto'
import { JwtGuard } from '../auth/jwt.guard'

@Controller('employees')
@UseGuards(JwtGuard)
export class EmployeesController {
  constructor(private svc: EmployeesService) {}

  private orgId(req: any) { return req.user?.orgId }

  @Get()
  list(@Req() req: any) {
    return this.svc.findAll(this.orgId(req))
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.svc.findOne(this.orgId(req), id)
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateEmployeeDto) {
    return this.svc.create(this.orgId(req), dto)
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.svc.update(this.orgId(req), id, data)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.svc.remove(this.orgId(req), id)
  }

  @Post('attendance')
  markAttendance(@Req() req: any, @Body() dto: MarkAttendanceDto) {
    return this.svc.markAttendance(this.orgId(req), dto)
  }

  @Get('attendance')
  getAttendance(@Req() req: any, @Query('userId') userId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.getAttendance(this.orgId(req), userId, from, to)
  }

  @Get('attendance/export')
  async attendanceExport(@Req() req: any, @Query('userId') userId?: string, @Query('from') from?: string, @Query('to') to?: string, @Res() res?: Response) {
    const orgId = this.orgId(req)
    const wb = await this.svc.attendanceExcel(orgId, userId, from, to)
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx')
    return res.send(buffer)
  }

  @Get(':id/timesheet')
  getTimesheet(@Req() req: any, @Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.getTimesheet(this.orgId(req), id, from, to)
  }

  @Get(':id/timesheet/combined')
  getCombinedTimesheet(@Req() req: any, @Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.combinedTimesheet(this.orgId(req), id, from, to)
  }

  @Get(':id/timesheet/export')
  async timesheetExport(@Req() req: any, @Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string, @Res() res?: Response) {
    const orgId = this.orgId(req)
    const wb = await this.svc.timesheetExcel(orgId, id, from, to)
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=timesheet_${id}.xlsx`)
    return res.send(buffer)
  }
}
