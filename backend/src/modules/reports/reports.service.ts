import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import * as ExcelJS from 'exceljs';
import axios from 'axios';
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

interface ChartDataset {
  data: number[];
}

interface ChartContext {
  dataset: ChartDataset;
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

    const generalAverage = this.calculateGeneralAverage(analytics);

    const report = this.reportRepository.create({
      survey,
      format,
      general_average: generalAverage,
    });
    const saved = await this.reportRepository.save(report);

    const filename = `report-${saved.id}.${this.extensionFor(format)}`;
    const filePath = path.join(REPORTS_DIR, filename);

    if (format === ReportFormat.CSV) {
      this.generateCsv(survey, analytics, filePath);
    } else if (format === ReportFormat.XLSX) {
      await this.generateXlsx(survey, analytics, filePath);
    } else {
      await this.generatePdf(survey, analytics, filePath);
    }

    saved.file_path = filePath;
    return this.reportRepository.save(saved);
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id, deleted: false },
      relations: { survey: true },
    });
    if (!report) {
      throw new NotFoundException(`Reporte ${id} no encontrado`);
    }
    return report;
  }

  async findBySurvey(surveyId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { survey: { id: surveyId }, deleted: false },
      order: { created_at: 'DESC' },
    });
  }

  private calculateGeneralAverage(analytics: Analytics[]): number | null {
    const averages = analytics
      .map((a) => a.average)
      .filter((avg): avg is number => avg !== null && avg !== undefined);

    if (averages.length === 0) return null;

    const sum = averages.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / averages.length).toFixed(2));
  }

  private getChartUrl(a: Analytics): string {
    const freqTable = a.frequency_table ?? {};
    const labels = Object.keys(freqTable);
    const data = Object.values(freqTable).map(Number);

    if (labels.length === 0) return '';

    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              '#F59E0B',
              '#3B82F6',
              '#10B981',
              '#EF4444',
              '#8B5CF6',
              '#EC4899',
              '#F97316',
              '#6366F1',
            ],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 }, padding: 20 },
          },
          datalabels: {
            display: true,
            color: '#fff',
            font: { weight: 'bold', size: 14 },
            formatter: (value: number, ctx: ChartContext): string => {
              const datasetData = ctx.dataset.data;
              const sum = datasetData.reduce(
                (acc: number, curr: number) => acc + curr,
                0,
              );
              return sum > 0 ? `${((value * 100) / sum).toFixed(1)}%` : '0%';
            },
          },
        },
      },
    };

    return `https://quickchart.io/chart?c=${encodeURIComponent(
      JSON.stringify(chartConfig),
    )}`;
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

  private async generateXlsx(
    survey: Survey,
    analytics: Analytics[],
    filePath: string,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte');

    // Encabezado
    sheet.mergeCells('A1:B1');
    sheet.getCell('A1').value = `Encuesta: ${survey.title}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.mergeCells('A2:B2');
    sheet.getCell('A2').value = `Descripción: ${survey.description ?? ''}`;

    sheet.mergeCells('A3:B3');
    sheet.getCell('A3').value = `Estado: ${survey.status}`;

    sheet.mergeCells('A4:B4');
    sheet.getCell('A4').value = `Fecha: ${
      survey.created_at
        ? new Date(survey.created_at).toLocaleDateString('es-EC')
        : ''
    }`;

    let currentRow = 6;

    for (const a of analytics) {
      // Pregunta
      sheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const qCell = sheet.getCell(`A${currentRow}`);
      qCell.value = `Pregunta: ${a.question?.text ?? ''}`;
      qCell.font = { bold: true, size: 12 };
      currentRow++;

      // Tabla de datos
      const headers = ['Opción', 'Frecuencia', 'Porcentaje'];
      sheet.getRow(currentRow).values = headers;
      sheet.getRow(currentRow).font = { bold: true };
      currentRow++;

      const freqTable = a.frequency_table ?? {};
      const pctTable = a.percentage_table ?? {};

      for (const [option, freq] of Object.entries(freqTable)) {
        sheet.getRow(currentRow).values = [
          option,
          Number(freq),
          pctTable[option] ?? 0,
        ];
        currentRow++;
      }

      // Gráfico
      const chartUrl = this.getChartUrl(a);
      if (chartUrl) {
        try {
          const response = await axios.get<ArrayBuffer>(chartUrl, {
            responseType: 'arraybuffer',
          });
          const imgBuffer = Buffer.from(response.data);
          const imageId = workbook.addImage({
            buffer: imgBuffer as unknown as ExcelJS.Buffer,
            extension: 'png',
          });

          // Colocar imagen DEBAJO de la tabla
          sheet.addImage(imageId, {
            tl: {
              col: 1,
              row: currentRow,
            },
            ext: { width: 400, height: 300 },
          });
          currentRow += 16; // Aumentar el espacio para la imagen
        } catch (e) {
          console.error(`Failed to fetch chart image for Excel:`, e);
        }
      }

      currentRow += 2; // Espacio entre preguntas
    }

    await workbook.xlsx.writeFile(filePath);
  }

  private async generatePdf(
    survey: Survey,
    analytics: Analytics[],
    filePath: string,
  ): Promise<void> {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    const streamPromise = new Promise<void>((resolve, reject) => {
      doc.on('error', reject);
      stream.on('error', reject);
      stream.on('finish', () => resolve());
    });

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

      // Add Chart
      const chartUrl = this.getChartUrl(a);
      if (chartUrl) {
        try {
          const response = await axios.get<ArrayBuffer>(chartUrl, {
            responseType: 'arraybuffer',
          });
          const imgBuffer = Buffer.from(response.data);

          if (y + 200 > 750) {
            doc.addPage();
            y = 40;
          }
          doc.image(imgBuffer, startX, y, { width: 300 });
          y += 220;
        } catch (e) {
          console.error(`Failed to fetch chart for question ${a.id}:`, e);
        }
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
        doc.fontSize(9).fillColor('#2563eb').text(extra.join('   '), startX, y);
        y += 16;
      }

      y += 12;
      doc.x = startX;
      doc.y = y;
    }

    doc.end();
    await streamPromise;
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

  async softDelete(id: string): Promise<void> {
    const report = await this.findOne(id);
    report.deleted = true;
    await this.reportRepository.save(report);
  }
}
