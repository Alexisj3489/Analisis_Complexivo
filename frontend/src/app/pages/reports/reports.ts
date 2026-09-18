import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export class Reports implements OnInit {
  private readonly surveysService = inject(SurveysService);
  private readonly reportsService = inject(ReportsService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  surveys = signal<Survey[]>([]);
  loading = signal<boolean>(true);

  selectedSurveyId = signal<string>('');
  selectedFormat = signal<ReportFormat>('PDF');

  generating = signal<boolean>(false);
  generatedReports = signal<Report[]>([]);
  errorMsg = signal<string | null>(null);
  downloadingId = signal<string | null>(null);

  showDeleteModal = signal<boolean>(false);
  reportToDeleteId = signal<string | null>(null);

  readonly formats: ReportFormat[] = ['PDF'];

  readonly formatLabels: Record<ReportFormat, string> = {
    PDF: 'PDF',
    XLSX: 'Excel',
  };

  ngOnInit(): void {
    this.loadSurveys();
  }

  private loadSurveys(): void {
    this.surveysService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (surveys) => {
          this.surveys.set(surveys);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toastService.error('Error al cargar las encuestas.');
        },
      });
  }

  onSurveyChange(): void {
    this.generatedReports.set([]);
    const surveyId = this.selectedSurveyId();
    if (!surveyId) return;

    this.reportsService
      .getBySurvey(surveyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reports) => this.generatedReports.set(reports),
        error: () => this.toastService.error('Error al cargar los reportes.'),
      });
  }

  generate(): void {
    const surveyId = this.selectedSurveyId();
    if (!surveyId) {
      this.errorMsg.set('Selecciona una encuesta primero.');
      return;
    }

    this.generating.set(true);
    this.errorMsg.set(null);

    this.reportsService
      .generate(surveyId, this.selectedFormat())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  download(report: Report): void {
    this.downloadingId.set(report.id);
    this.reportsService
      .downloadBlob(report.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const rawTitle = this.surveyTitle(this.selectedSurveyId());
          const surveyName = rawTitle.replace(/[^a-z0-9]/gi, '_') || 'reporte';
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${surveyName}-reporte.${report.format.toLowerCase()}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.downloadingId.set(null);
        },
        error: () => {
          this.toastService.error('No se pudo descargar el reporte.');
          this.downloadingId.set(null);
        },
      });
  }

  deleteReport(reportId: string): void {
    this.reportToDeleteId.set(reportId);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const reportId = this.reportToDeleteId();
    if (!reportId) return;

    this.reportsService
      .delete(reportId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.generatedReports.update((list) => list.filter((r) => r.id !== reportId));
          this.toastService.success('Reporte eliminado.');
          this.showDeleteModal.set(false);
          this.reportToDeleteId.set(null);
        },
        error: () => this.toastService.error('No se pudo eliminar el reporte.'),
      });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.reportToDeleteId.set(null);
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