import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Res,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() dto: CreateReportDto) {
    return this.reportsService.generate(dto.surveyId, dto.format);
  }

  @Get('survey/:surveyId')
  findBySurvey(@Param('surveyId', ParseUUIDPipe) surveyId: string) {
    return this.reportsService.findBySurvey(surveyId);
  }

  @Get(':id/download')
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const report = await this.reportsService.findOne(id);

    if (!report.file_path) {
      throw new NotFoundException('El archivo del reporte no está disponible');
    }

    const ext = report.file_path.split('.').pop();
    const safeName = report.survey.title.replace(/[^a-z0-9]/gi, '_');
    res.download(report.file_path, `${safeName}-reporte.${ext}`);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.remove(id);
  }
}
