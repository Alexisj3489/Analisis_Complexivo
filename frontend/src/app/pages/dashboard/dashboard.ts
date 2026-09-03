import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SurveysService } from '../../services/surveys.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Survey } from '../../models/survey.model';

interface BarDatum {
  label: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private surveysService = inject(SurveysService);
  private analyticsService = inject(AnalyticsService);

  surveys = signal<Survey[]>([]);
  overallAverage = signal<number | null>(null);
  loading = signal(true);
  error = signal(false);

  totalSurveys = computed(() => this.surveys().length);

  totalResponses = computed(() =>
    this.surveys().reduce(
      (sum, s) => sum + s.responses.filter((r) => r.status === 'COMPLETADO').length,
      0,
    ),
  );

  publishedCount = computed(() => this.surveys().filter((s) => s.status === 'PUBLISHED').length);
  draftCount = computed(() => this.surveys().filter((s) => s.status === 'DRAFT').length);

  responsesBySurvey = computed<BarDatum[]>(() =>
    this.surveys()
      .map((s) => ({
        label: s.title,
        value: s.responses.filter((r) => r.status === 'COMPLETADO').length,
      }))
      .sort((a, b) => b.value - a.value),
  );

  responsesByPeriod = computed<BarDatum[]>(() => {
    const counts: Record<string, number> = {};
    for (const s of this.surveys()) {
      for (const r of s.responses) {
        if (r.status !== 'COMPLETADO') continue;
        const key = new Date(r.submitted_at).toLocaleDateString('es-EC', {
          month: 'short',
          year: 'numeric',
        });
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  });

  statusDistribution = computed<BarDatum[]>(() => {
    const counts: Record<string, number> = { COMPLETADO: 0, PROCESANDO: 0, PENDIENTE: 0, FALLIDO: 0 };
    for (const s of this.surveys()) {
      for (const r of s.responses) {
        counts[r.status] = (counts[r.status] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .filter((d) => d.value > 0);
  });

  statusColor(label: string): string {
    const colors: Record<string, string> = {
      COMPLETADO: '#16a34a',
      PROCESANDO: '#2563eb',
      PENDIENTE: '#9ca3af',
      FALLIDO: '#dc2626',
    };
    return colors[label] ?? '#9ca3af';
  }

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);

    this.surveysService.getAll().subscribe({
      next: (surveys) => {
        this.surveys.set(surveys);
        this.loadAverages(surveys);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadAverages(surveys: Survey[]) {
    if (surveys.length === 0) {
      this.loading.set(false);
      return;
    }

    forkJoin(surveys.map((s) => this.analyticsService.getBySurvey(s.id))).subscribe({
      next: (allAnalytics) => {
        const averages: number[] = [];
        for (const analyticsList of allAnalytics) {
          for (const a of analyticsList) {
            if (a.average !== null) averages.push(a.average);
          }
        }
        this.overallAverage.set(
          averages.length > 0
            ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) / 100
            : null,
        );
        this.loading.set(false);
      },
      error: () => {
        // Si falla el detalle de analíticas, igual mostramos el resto del dashboard
        this.loading.set(false);
      },
    });
  }

  maxValue(data: BarDatum[]): number {
    return data.length > 0 ? Math.max(...data.map((d) => d.value), 1) : 1;
  }

  barColor(index: number): string {
    const palette = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    return palette[index % palette.length];
  }
}