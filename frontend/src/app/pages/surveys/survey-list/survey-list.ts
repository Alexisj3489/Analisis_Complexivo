import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SurveysService } from '../../../services/surveys.service';
import { ToastService } from '../../../services/toast.service';
import { Survey } from '../../../models/survey.model';

@Component({
  selector: 'app-survey-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './survey-list.html',
})
export class SurveyList {
  private surveysService = inject(SurveysService);
  private toastService = inject(ToastService);

  surveys = signal<Survey[]>([]);
  loading = signal(true);
  error = signal(false);
  searchTitle = '';

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    const query = this.searchTitle ? { title: this.searchTitle } : undefined;

    this.surveysService.getAll(query).subscribe({
      next: (res: any) => {
        const data = res as Survey[];
        this.surveys.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  onSearch() {
    this.load();
  }

  deleteSurvey(id: string, title: string) {
    if (!confirm(`¿Eliminar la encuesta "${title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.surveysService.delete(id).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Encuesta eliminada correctamente.');
      },
      error: () => this.toastService.error('No se pudo eliminar la encuesta.'),
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = { DRAFT: 'Borrador', PUBLISHED: 'Publicada', CLOSED: 'Cerrada' };
    return labels[status] ?? status;
  }

  statusClasses(status: string): string {
    const classes: Record<string, string> = {
      DRAFT: 'bg-zinc-700 text-zinc-300',
      PUBLISHED: 'bg-amber-500 text-zinc-900',
      CLOSED: 'bg-red-950 text-red-400',
    };
    return classes[status] ?? 'bg-zinc-700 text-zinc-300';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}