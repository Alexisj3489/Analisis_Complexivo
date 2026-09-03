import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SurveysService } from '../../../services/surveys.service';
import { Survey } from '../../../models/survey.model';

@Component({
  selector: 'app-survey-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './survey-list.html',
})
export class SurveyList {
  private surveysService = inject(SurveysService);

  surveys = signal<Survey[]>([]);
  loading = signal(true);
  error = signal(false);

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.surveysService.getAll().subscribe({
      next: (data) => {
        this.surveys.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  deleteSurvey(id: string, title: string) {
    if (!confirm(`¿Eliminar la encuesta "${title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.surveysService.delete(id).subscribe({
      next: () => this.load(),
      error: () => alert('No se pudo eliminar la encuesta.'),
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      PUBLISHED: 'Publicada',
      CLOSED: 'Cerrada',
    };
    return labels[status] ?? status;
  }

  statusClasses(status: string): string {
    const classes: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PUBLISHED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-red-100 text-red-700',
    };
    return classes[status] ?? 'bg-gray-100 text-gray-700';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}