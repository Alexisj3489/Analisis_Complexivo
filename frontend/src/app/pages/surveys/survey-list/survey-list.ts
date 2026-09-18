import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SurveysService } from '../../../services/surveys.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Survey, SurveyStatus } from '../../../models/survey.model';

@Component({
  selector: 'app-survey-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './survey-list.html',
})
export class SurveyList {
  private surveysService = inject(SurveysService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  surveys = signal<Survey[]>([]);
  loading = signal(true);
  error = signal(false);
  searchTitle = '';
  searchStatus = '';
  searchDate = '';

  showDeleteModal = signal(false);
  surveyToDeleteId = signal<string | null>(null);
  surveyToDeleteTitle = signal<string>('');

  isAdmin = computed(() => {
    const user = this.authService.currentUser?.();
    return user?.role === 'ADMIN' || user?.role === 'ADMINISTRATOR';
  });

  isOwner(survey: Survey): boolean {
    const user = this.authService.currentUser?.();
    return (survey as { createdBy?: { id: string } }).createdBy?.id === user?.id;
  }

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    const query = {
      title: this.searchTitle || undefined,
      status: this.searchStatus || undefined,
      date: this.searchDate || undefined,
    };

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

  changeStatus(survey: Survey, newStatus: SurveyStatus) {
    if (!this.isAdmin() && !this.isOwner(survey)) return;

    this.surveysService.updateStatus(survey.id, newStatus).subscribe({
      next: () => {
        this.surveys.update((list) =>
          list.map((s) => (s.id === survey.id ? { ...s, status: newStatus } : s))
        );
        this.toastService.success(`Estado actualizado a ${this.statusLabel(newStatus)}.`);
      },
      error: () => this.toastService.error('No se pudo actualizar el estado de la encuesta.'),
    });
  }

  deleteSurvey(id: string, title: string) {
    if (!this.isAdmin()) return;

    this.surveyToDeleteId.set(id);
    this.surveyToDeleteTitle.set(title);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const id = this.surveyToDeleteId();
    if (!id) return;

    this.surveysService.delete(id).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Encuesta eliminada correctamente.');
        this.showDeleteModal.set(false);
        this.surveyToDeleteId.set(null);
      },
      error: () => this.toastService.error('No se pudo eliminar la encuesta.'),
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.surveyToDeleteId.set(null);
  }

  statusLabel(status: SurveyStatus | string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      PUBLISHED: 'Publicada',
      CLOSED: 'Finalizada',
    };
    return labels[status] ?? status;
  }

  statusClasses(status: SurveyStatus | string): string {
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
}