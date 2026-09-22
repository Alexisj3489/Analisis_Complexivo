import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, RouterLink],
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
  graphsOnly = signal(false);

  importing = signal(false);
  importSummary = signal<ImportSummary | null>(null);
  importErrorMsg = signal<string | null>(null);

  totalResponses = computed(() => {
    const s = this.survey();
    return s ? s.responses.filter((r) => r.status === 'COMPLETADO').length : 0;
  });

  // Mapeos semánticos predefinidos por tipo de pregunta
  private readonly SEMANTIC_MAPS: Record<string, { order: string[]; colors: Record<string, string> }> = {
    SCALE_1_5: {
      order: ['5', '4', '3', '2', '1'],
      colors: {
        '5': '#10b981', // Emerald
        '4': '#3b82f6', // Blue
        '3': '#f59e0b', // Amber
        '2': '#f97316', // Orange
        '1': '#ef4444', // Red
      },
    },
    RATING_1_5: {
      order: ['5', '4', '3', '2', '1'],
      colors: {
        '5': '#10b981',
        '4': '#3b82f6',
        '3': '#f59e0b',
        '2': '#f97316',
        '1': '#ef4444',
      },
    },
    YES_NO: {
      order: ['Sí', 'Si', 'No'],
      colors: {
        'Sí': '#10b981',
        'Si': '#10b981',
        'No': '#ef4444',
      },
    },
    FREQUENCY: {
      order: ['Siempre', 'Frecuentemente', 'A veces', 'Rara vez', 'Nunca'],
      colors: {
        'Siempre': '#10b981',
        'Frecuentemente': '#3b82f6',
        'A veces': '#f59e0b',
        'Rara vez': '#f97316',
        'Nunca': '#ef4444',
      },
    },
  };

  // Orden heurístico para opciones cualitativas
  private readonly GENERAL_ORDER_RANK: Record<string, number> = {
    'excelente': 1,
    'muy buena': 2, 'muy bueno': 2, 'muy satisfecho': 2,
    'buena': 3, 'bueno': 3, 'satisfecho': 3,
    'regular': 4, 'neutral': 4, 'indiferente': 4,
    'mala': 5, 'malo': 5, 'insatisfecho': 5,
    'muy mala': 6, 'muy malo': 6, 'pésimo': 6, 'pesimo': 6,
    'sí': 1, 'si': 1,
    'no': 2,
  };

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
        this.load(survey.id);
      },
      error: (err) => {
        this.importErrorMsg.set(err?.error?.message ?? 'No se pudo importar el archivo.');
        this.importing.set(false);
      },
    });

    input.value = '';
  }

  freqRows(a: QuestionAnalytics): FreqRow[] {
    const rows = Object.entries(a.frequency_table).map(([label, count]) => ({
      label,
      count,
      percentage: a.percentage_table[label] ?? 0,
    }));

    const qType = a.question?.type ?? (a as any).question_type;
    const map = this.SEMANTIC_MAPS[qType];

    if (map) {
      return rows.sort((x, y) => {
        const idxX = map.order.indexOf(x.label);
        const idxY = map.order.indexOf(y.label);
        if (idxX !== -1 && idxY !== -1) return idxX - idxY;
        if (idxX !== -1) return -1;
        if (idxY !== -1) return 1;
        return y.count - x.count;
      });
    }

    // Si no hay mapeo estricto por tipo, ordena por el ranking cualitativo de mejor a peor
    return rows.sort((x, y) => {
      const rankX = this.GENERAL_ORDER_RANK[x.label.trim().toLowerCase()] ?? 99;
      const rankY = this.GENERAL_ORDER_RANK[y.label.trim().toLowerCase()] ?? 99;

      if (rankX !== rankY) {
        return rankX - rankY;
      }
      return y.count - x.count;
    });
  }

  maxCount(a: QuestionAnalytics): number {
    const rows = this.freqRows(a);
    return rows.length > 0 ? Math.max(...rows.map((r) => r.count), 1) : 1;
  }

  isDonutType(type: string): boolean {
    return type === 'YES_NO';
  }

  isHorizontalType(type: string): boolean {
    return type !== 'YES_NO';
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

  donutGradient(a: QuestionAnalytics): string {
    const rows = this.freqRows(a);
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    if (total === 0) return 'conic-gradient(#e5e7eb 0deg 360deg)';

    const qType = a.question?.type ?? (a as any).question_type;
    let acc = 0;
    const stops: string[] = [];
    rows.forEach((row) => {
      const start = (acc / total) * 360;
      acc += row.count;
      const end = (acc / total) * 360;
      stops.push(`${this.barColor(row.label, qType)} ${start}deg ${end}deg`);
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  barColor(label: string, type?: string, lighter: boolean = false): string {
    if (type && this.SEMANTIC_MAPS[type]?.colors[label]) {
      const color = this.SEMANTIC_MAPS[type].colors[label];
      return lighter ? this.lightenColor(color) : color;
    }

    const lowerLabel = label.trim().toLowerCase();

    if (
      lowerLabel.includes('excelente') ||
      lowerLabel.includes('muy buena') ||
      lowerLabel.includes('muy bueno') ||
      lowerLabel.includes('satisfecho') ||
      lowerLabel === 'sí' ||
      lowerLabel === 'si'
    ) {
      return lighter ? '#6ee7b7' : '#10b981'; // Verde
    }

    if (lowerLabel.includes('buena') || lowerLabel.includes('bueno')) {
      return lighter ? '#93c5fd' : '#3b82f6'; // Azul
    }

    if (lowerLabel.includes('regular') || lowerLabel.includes('neutral') || lowerLabel.includes('a veces')) {
      return lighter ? '#fde68a' : '#f59e0b'; // Amarillo / Ámbar
    }

    if (lowerLabel.includes('mala') || lowerLabel.includes('malo')) {
      return lighter ? '#fdba74' : '#f97316'; // Naranja
    }

    if (
      lowerLabel.includes('muy mala') ||
      lowerLabel.includes('muy malo') ||
      lowerLabel.includes('pésimo') ||
      lowerLabel.includes('pesimo') ||
      lowerLabel === 'no'
    ) {
      return lighter ? '#fda4af' : '#ef4444'; // Rojo
    }

    const palette = ['#6366f1', '#3b82f6', '#8b5cf6', '#06b6d4'];
    const colorIdx = Math.abs(label.length) % palette.length;
    const color = palette[colorIdx];
    return lighter ? '#a5b4fc' : color;
  }

  private lightenColor(hex: string): string {
    const lightMap: Record<string, string> = {
      '#10b981': '#6ee7b7',
      '#3b82f6': '#93c5fd',
      '#34d399': '#a7f3d0',
      '#f59e0b': '#fde68a',
      '#fbbf24': '#fde68a',
      '#f97316': '#fdba74',
      '#f87171': '#fca5a5',
      '#ef4444': '#fecaca',
    };
    return lightMap[hex] ?? hex;
  }
}