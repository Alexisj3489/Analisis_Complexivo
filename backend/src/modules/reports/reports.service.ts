import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { Report } from './entities/report.entity';
import { ReportFormat } from '../../common/enums/report-format.enum';
import { SurveysService } from '../surveys/surveys.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Survey } from '../surveys/entities/survey.entity';
import { Analytics } from '../analytics/entities/analytics.entity';

const REPORTS_DIR = path.join(process.cwd(), 'storage', 'reports');

interface ReportRow {
  question: string;
  type: string;
  totalResponses: number;
  option: string;
  frequency: number;
  percentage: number;
  average: string;
  mode: string;
  min: string;
  max: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly surveysService: SurveysService,
    private readonly analyticsService: AnalyticsService,
  ) {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
  }

  async generate(surveyId: string, format: ReportFormat): Promise<Report> {
    const survey = await this.surveysService.findOne(surveyId);
    const analytics = await this.analyticsService.findBySurvey(surveyId);

    const report = this.reportRepository.create({ survey, format });
    const saved = await this.reportRepository.save(report);

    const filename = `report-${saved.id}.${this.extensionFor(format)}`;
    const filePath = path.join(REPORTS_DIR, filename);

    if (format === ReportFormat.CSV) {
      this.generateCsv(survey, analytics, filePath);
    } else if (format === ReportFormat.XLSX) {
      this.generateXlsx(survey, analytics, filePath);
    } else {
      await this.generatePdf(survey, analytics, filePath);
    }

    saved.file_path = filePath;
    return this.reportRepository.save(saved);
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: { survey: true },
    });
    if (!report) {
      throw new NotFoundException(`Reporte ${id} no encontrado`);
    }
    return report;
  }

  async findBySurvey(surveyId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { survey: { id: surveyId } },
      order: { created_at: 'DESC' },
    });
  }

  private extensionFor(format: ReportFormat): string {
    const map: Record<ReportFormat, string> = {
      CSV: 'csv',
      XLSX: 'xlsx',
      PDF: 'pdf',
    };
    return map[format];
  }

  private buildRows(analytics: Analytics[]): ReportRow[] {
    const rows: ReportRow[] = [];
    for (const a of analytics) {
      const freqTable = a.frequency_table ?? {};
      const pctTable = a.percentage_table ?? {};
      const modeStr = Array.isArray(a.mode) ? a.mode.join(', ') : '';

      for (const [option, freq] of Object.entries(freqTable)) {
        rows.push({
          question: a.question?.text ?? '',
          type: a.question?.type ?? '',
          totalResponses: a.total_responses ?? 0,
          option,
          frequency: Number(freq) || 0,
          percentage: pctTable[option] ?? 0,
          average:
            a.average !== null && a.average !== undefined
              ? String(a.average)
              : '',
          mode: modeStr,
          min: a.min !== null && a.min !== undefined ? String(a.min) : '',
          max: a.max !== null && a.max !== undefined ? String(a.max) : '',
        });
      }
    }
    return rows;
  }

  private generateCsv(
    survey: Survey,
    analytics: Analytics[],
    filePath: string,
  ): void {
    const rows = this.buildRows(analytics);
    const table = Papa.unparse({
      fields: [
        'Pregunta',
        'Tipo',
        'Total Respuestas',
        'Opcion',
        'Frecuencia',
        'Porcentaje',
        'Promedio',
        'Moda',
        'Min',
        'Max',
      ],
      data: rows.map((r) => [
        r.question,
        r.type,
        r.totalResponses,
        r.option,
        r.frequency,
        r.percentage,
        r.average,
        r.mode,
        r.min,
        r.max,
      ]),
    });

    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const header =
      `Encuesta,${escapeCsv(survey.title)}\n` +
      `Descripcion,${escapeCsv(survey.description ?? '')}\n` +
      `Estado,${escapeCsv(survey.status)}\n\n`;

    fs.writeFileSync(filePath, header + table, 'utf-8');
  }

  private generateXlsx(
    survey: Survey,
    analytics: Analytics[],
    filePath: string,
  ): void {
    const rows = this.buildRows(analytics);

    const infoRows = [
      ['Encuesta', survey.title],
      ['Descripcion', survey.description ?? ''],
      ['Estado', survey.status],
      [
        'Fecha de creacion',
        survey.created_at
          ? new Date(survey.created_at).toLocaleDateString('es-EC')
          : '',
      ],
      [],
    ];

    const tableHeader = [
      'Pregunta',
      'Tipo',
      'Total Respuestas',
      'Opcion',
      'Frecuencia',
      'Porcentaje',
      'Promedio',
      'Moda',
      'Min',
      'Max',
    ];
    const tableRows = rows.map((r) => [
      r.question,
      r.type,
      r.totalResponses,
      r.option,
      r.frequency,
      r.percentage,
      r.average,
      r.mode,
      r.min,
      r.max,
    ]);

    const sheetData = [...infoRows, tableHeader, ...tableRows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    XLSX.writeFile(workbook, filePath);
  }

  private generatePdf(
    survey: Survey,
    analytics: Analytics[],
    filePath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      doc.on('error', reject);
      stream.on('error', reject);
      stream.on('finish', () => resolve());

      doc
        .fontSize(18)
        .fillColor('#1e3a8a')
        .text(survey.title, { underline: true });
      doc.moveDown(0.3);
      if (survey.description) {
        doc.fontSize(10).fillColor('#555').text(survey.description);
      }
      doc.fontSize(10).fillColor('#555').text(`Estado: ${survey.status}`);
      const dateStr = survey.created_at
        ? new Date(survey.created_at).toLocaleDateString('es-EC')
        : '';
      doc.fontSize(10).fillColor('#555').text(`Fecha: ${dateStr}`);
      doc.moveDown();

      const startX = doc.x;
      const colWidths = [220, 80, 80];

      for (const a of analytics) {
        if (doc.y > 650) {
          doc.addPage();
        }

        doc
          .fontSize(13)
          .fillColor('#111')
          .text(a.question?.text ?? '');
        doc
          .fontSize(9)
          .fillColor('#666')
          .text(
            `${a.question?.type ?? ''} · ${a.total_responses ?? 0} respuestas`,
          );
        doc.moveDown(0.3);

        let y = doc.y;
        let x = startX;
        doc.fontSize(9).fillColor('#333');
        ['Opción', 'Frecuencia', 'Porcentaje'].forEach((h, i) => {
          doc.text(h, x, y, { width: colWidths[i] });
          x += colWidths[i];
        });
        y += 14;

        const freqTable = a.frequency_table ?? {};
        const pctTable = a.percentage_table ?? {};

        for (const [option, freq] of Object.entries(freqTable)) {
          if (y > 700) {
            doc.addPage();
            y = 40;
          }
          const pct = pctTable[option] ?? 0;
          x = startX;
          doc.fontSize(9).fillColor('#444');
          doc.text(option, x, y, { width: colWidths[0] });
          x += colWidths[0];
          doc.text(String(freq), x, y, { width: colWidths[1] });
          x += colWidths[1];
          doc.text(`${pct}%`, x, y, { width: colWidths[2] });
          y += 14;
        }

        y += 4;
        if (y > 700) {
          doc.addPage();
          y = 40;
        }

        const extra: string[] = [];
        if (a.average !== null && a.average !== undefined) {
          extra.push(`Promedio: ${a.average}`);
        }
        if (Array.isArray(a.mode) && a.mode.length > 0) {
          extra.push(`Moda: ${a.mode.join(', ')}`);
        }
        if (a.min !== null && a.min !== undefined) {
          extra.push(`Mín: ${a.min}`);
        }
        if (a.max !== null && a.max !== undefined) {
          extra.push(`Máx: ${a.max}`);
        }

        if (extra.length > 0) {
          doc
            .fontSize(9)
            .fillColor('#2563eb')
            .text(extra.join('   '), startX, y);
          y += 16;
        }

        y += 12;
        doc.x = startX;
        doc.y = y;
      }

      doc.end();
    });
  }
  async remove(id: string): Promise<void> {
    const report = await this.findOne(id);
    if (report.file_path && fs.existsSync(report.file_path)) {
      try {
        fs.unlinkSync(report.file_path);
      } catch {
        // si el archivo ya no está en disco, igual eliminamos el registro
      }
    }
    await this.reportRepository.remove(report);
  }
}
