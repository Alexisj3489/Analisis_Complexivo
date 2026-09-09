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

  surveysTrend = computed(() => this.monthTrend(this.surveys().map((s) => s.created_at)));

  responsesTrend = computed(() => {
    const dates = this.surveys().flatMap((s) =>
      s.responses.filter((r) => r.status === 'COMPLETADO').map((r) => r.submitted_at),
    );
    return this.monthTrend(dates);
  });

  responsesSparkline = computed(() => this.responsesByPeriod().slice(-6).map((d) => d.value));

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
        this.loading.set(false);
      },
    });
  }

  /**
   * Calcula el porcentaje de variación del mes actual con respecto al mes anterior.
   */
  private monthTrend(dateStrings: string[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let thisMonthCount = 0;
    let lastMonthCount = 0;

    for (const dateStr of dateStrings) {
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const m = d.getMonth();
      const y = d.getFullYear();

      if (m === currentMonth && y === currentYear) {
        thisMonthCount++;
      } else if (m === prevMonth && y === prevYear) {
        lastMonthCount++;
      }
    }

    if (lastMonthCount === 0) return thisMonthCount > 0 ? 100 : 0;
    return Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
  }

  maxValue(data: BarDatum[]): number {
    return data.length > 0 ? Math.max(...data.map((d) => d.value), 1) : 1;
  }

  barColor(index: number): string {
    const palette = ['#f59e0b', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
    return palette[index % palette.length];
  }

  // --- FUNCIONES AÑADIDAS PARA SOLUCIONAR LOS ERRORES DEL HTML ---

  sparkMax(data: number[]): number {
    return data.length > 0 ? Math.max(...data) : 1;
  }

  distributionTotal(): number {
    const dist = this.statusDistribution();
    return dist ? dist.reduce((total, item) => total + item.value, 0) : 0;
  }

  distributionPercent(value: number): number {
    const total = this.distributionTotal();
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }

  donutGradient(): string {
    const data = this.statusDistribution();
    if (!data || data.length === 0) return 'transparent';

    let currentPercentage = 0;
    const gradientStops = data.map((item) => {
      const percentage = (item.value / this.distributionTotal()) * 100;
      const start = currentPercentage;
      const end = currentPercentage + percentage;
      currentPercentage = end;
      
      const color = this.statusColor(item.label) || '#3f3f46';
      return `${color} ${start}% ${end}%`;
    });

    return `conic-gradient(${gradientStops.join(', ')})`;
  }
}