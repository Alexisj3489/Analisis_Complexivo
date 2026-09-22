import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SurveysService } from '../../services/surveys.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Survey } from '../../models/survey.model';
import { ToastService } from '../../services/toast.service';

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
  protected readonly Math = Math;

  private surveysService = inject(SurveysService);
  private analyticsService = inject(AnalyticsService);
  private toastService = inject(ToastService);

  surveys = signal<Survey[]>([]);
  finishedCount = computed(() => this.surveys().filter((s) => s.status === 'CLOSED').length);
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
    this.showWelcomeToast();
  }

  private showWelcomeToast() {
    const userRole: string = 'USER'; // Forzamos el tipo string para evitar la estrechez de tipo
    const toast = this.toastService as any;

    if (userRole === 'ADMIN') {
      if (typeof toast.info === 'function') {
        toast.info('¡Bienvenido, Administrador!', 'Tienes acceso total para gestionar encuestas, usuarios y configuraciones del sistema.');
      } else if (typeof toast.show === 'function') {
        toast.show('¡Bienvenido, Administrador!', 'Tienes acceso total para gestionar encuestas, usuarios y configuraciones del sistema.', 'info');
      }
    } else {
      if (typeof toast.success === 'function') {
        toast.success('¡Bienvenido de vuelta!', 'Puedes visualizar tus resultados y el progreso de las encuestas.');
      } else if (typeof toast.show === 'function') {
        toast.show('¡Bienvenido de vuelta!', 'Puedes visualizar tus resultados y el progreso de las encuestas.', 'success');
      }
    }
  }

  load() {
    this.loading.set(true);
    this.error.set(false);

    this.surveysService.getAll().subscribe({
      next: (res: any) => {
        const surveys: Survey[] = res as Survey[];
        this.surveys.set(surveys);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

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

  barColor(index: number, lighter: boolean = false): string {
    const palette = [
      { main: '#6366f1', light: '#a5b4fc' },
      { main: '#3b82f6', light: '#93c5fd' },
      { main: '#10b981', light: '#6ee7b7' },
      { main: '#f43f5e', light: '#fda4af' },
      { main: '#8b5cf6', light: '#c4b5fd' },
      { main: '#06b6d4', light: '#67e8f9' },
      { main: '#ec4899', light: '#f9a8d4' },
      { main: '#84cc16', light: '#bef264' },
    ];
    const color = palette[index % palette.length];
    return lighter ? color.light : color.main;
  }

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

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Sin Publicar',
      PUBLISHED: 'Publicada',
      CLOSED: 'Finalizada',
    };
    return labels[status] ?? status;
  }

  statusClasses(status: string): string {
    const classes: Record<string, string> = {
      DRAFT: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
      PUBLISHED: 'bg-amber-500/20 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/30',
      CLOSED: 'bg-red-500/20 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-500/30',
    };
    return classes[status] ?? 'bg-slate-200 text-slate-800';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
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