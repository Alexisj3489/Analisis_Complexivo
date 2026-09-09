import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SurveysService } from '../../services/surveys.service';
import { ReportsService } from '../../services/reports.service';
import { ToastService } from '../../services/toast.service';
import { Survey } from '../../models/survey.model';
import { Report, ReportFormat } from '../../models/report.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
})
export class Reports {
  private surveysService = inject(SurveysService);
  private reportsService = inject(ReportsService);
  private toastService = inject(ToastService);

  surveys = signal<Survey[]>([]);
  loading = signal(true);

  selectedSurveyId = '';
  selectedFormat: ReportFormat = 'PDF';

  generating = signal(false);
  generatedReports = signal<Report[]>([]);
  errorMsg = signal<string | null>(null);
  downloadingId = signal<string | null>(null);

  // Arreglo tipado para iterar de manera segura en el HTML
  formats: ReportFormat[] = ['XLSX', 'PDF'];

  formatLabels: Record<ReportFormat, string> = {
    XLSX: 'Excel',
    PDF: 'PDF',
  };

  constructor() {
    this.surveysService.getAll().subscribe({
      next: (data) => {
        this.surveys.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSurveyChange() {
    this.generatedReports.set([]);
    if (!this.selectedSurveyId) return;
    this.reportsService.getBySurvey(this.selectedSurveyId).subscribe({
      next: (reports) => this.generatedReports.set(reports),
      error: () => {},
    });
  }

  generate() {
    if (!this.selectedSurveyId) {
      this.errorMsg.set('Selecciona una encuesta primero.');
      return;
    }
    this.generating.set(true);
    this.errorMsg.set(null);

    this.reportsService.generate(this.selectedSurveyId, this.selectedFormat).subscribe({
      next: (report) => {
        this.generatedReports.update((list) => [report, ...list]);
        this.generating.set(false);
        this.toastService.success('Reporte generado correctamente.');
      },
      error: () => {
        this.errorMsg.set('No se pudo generar el reporte.');
        this.generating.set(false);
        this.toastService.error('No se pudo generar el reporte.');
      },
    });
  }

  download(report: Report) {
    this.downloadingId.set(report.id);
    this.reportsService.downloadBlob(report.id).subscribe({
      next: (blob) => {
        const surveyName = this.surveyTitle(this.selectedSurveyId).replace(/[^a-z0-9]/gi, '_') || 'reporte';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${surveyName}-reporte.${report.format.toLowerCase()}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadingId.set(null);
      },
      error: () => {
        this.toastService.error('No se pudo descargar el reporte.');
        this.downloadingId.set(null);
      },
    });
  }

  deleteReport(reportId: string) {
    if (!confirm('¿Eliminar este reporte generado?')) return;
    this.reportsService.delete(reportId).subscribe({
      next: () => {
        this.generatedReports.update((list) => list.filter((r) => r.id !== reportId));
        this.toastService.success('Reporte eliminado.');
      },
      error: () => this.toastService.error('No se pudo eliminar el reporte.'),
    });
  }

  surveyTitle(surveyId: string): string {
    return this.surveys().find((s) => s.id === surveyId)?.title ?? '';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-EC', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}