import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SurveysService } from '../../../services/surveys.service';
import { AnalyticsService } from '../../../services/analytics.service';
import { Survey } from '../../../models/survey.model';
import { QuestionAnalytics, ImportSummary } from '../../../models/analytics.model';

interface FreqRow {
  label: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-survey-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './survey-results.html',
})
export class SurveyResults {
  private route = inject(ActivatedRoute);
  private surveysService = inject(SurveysService);
  private analyticsService = inject(AnalyticsService);

  survey = signal<Survey | null>(null);
  analytics = signal<QuestionAnalytics[]>([]);
  loading = signal(true);
  error = signal(false);

  importing = signal(false);
  importSummary = signal<ImportSummary | null>(null);
  importErrorMsg = signal<string | null>(null);

  totalResponses = computed(() => {
    const s = this.survey();
    return s ? s.responses.filter((r) => r.status === 'COMPLETADO').length : 0;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    } else {
      this.loading.set(false);
      this.error.set(true);
    }
  }

  load(id: string) {
    this.loading.set(true);
    this.error.set(false);

    this.surveysService.getOne(id).subscribe({
      next: (survey) => {
        this.survey.set(survey);
        this.analyticsService.getBySurvey(id).subscribe({
          next: (data) => {
            this.analytics.set(data);
            this.loading.set(false);
          },
          error: () => {
            this.error.set(true);
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const survey = this.survey();
    if (!file || !survey) return;

    this.importing.set(true);
    this.importSummary.set(null);
    this.importErrorMsg.set(null);

    this.analyticsService.importFile(survey.id, file).subscribe({
      next: (result) => {
        this.importSummary.set(result);
        this.importing.set(false);
        this.load(survey.id); // recarga resultados con los datos nuevos
      },
      error: (err) => {
        this.importErrorMsg.set(err?.error?.message ?? 'No se pudo importar el archivo.');
        this.importing.set(false);
      },
    });

    input.value = ''; // permite volver a subir el mismo archivo si hace falta
  }

  freqRows(a: QuestionAnalytics): FreqRow[] {
    return Object.entries(a.frequency_table)
      .map(([label, count]) => ({
        label,
        count,
        percentage: a.percentage_table[label] ?? 0,
      }))
      .sort((x, y) => y.count - x.count);
  }

  maxCount(a: QuestionAnalytics): number {
    const rows = this.freqRows(a);
    return rows.length > 0 ? Math.max(...rows.map((r) => r.count), 1) : 1;
  }

  isDonutType(type: string): boolean {
    return type === 'YES_NO';
  }

  isHorizontalType(type: string): boolean {
    return type === 'MULTIPLE_CHOICE';
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      SINGLE_CHOICE: 'Selección única',
      YES_NO: 'Sí / No',
      SCALE_1_5: 'Escala numérica (1-5)',
      RATING_1_5: 'Rating (1-5)',
      MULTIPLE_CHOICE: 'Selección múltiple',
      FREQUENCY: 'Escala de frecuencia',
    };
    return labels[type] ?? type;
  }

  // Gradiente cónico para la dona de Sí/No
  donutGradient(a: QuestionAnalytics): string {
    const rows = this.freqRows(a);
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    if (total === 0) return 'conic-gradient(#3f3f46 0deg 360deg)';

    const colors = ['#10b981', '#f43f5e'];
    let acc = 0;
    const stops: string[] = [];
    rows.forEach((row, idx) => {
      const start = (acc / total) * 360;
      acc += row.count;
      const end = (acc / total) * 360;
      stops.push(`${colors[idx % colors.length]} ${start}deg ${end}deg`);
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  barColor(index: number): string {
    const palette = ['#f59e0b', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
    return palette[index % palette.length];
  }
}