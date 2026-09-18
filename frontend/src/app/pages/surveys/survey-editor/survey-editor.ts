import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SurveysService } from '../../../services/surveys.service';
import { QuestionsService, CreateQuestionPayload } from '../../../services/questions.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { Survey, SurveyQuestion, QuestionType } from '../../../models/survey.model';

interface DraftOption {
  text: string;
}

interface DraftQuestion {
  text: string;
  type: QuestionType;
  required: boolean;
  options: DraftOption[];
}

interface EditDraftOption {
  id?: string;
  text: string;
}

interface EditDraft {
  text: string;
  required: boolean;
  options: EditDraftOption[];
}

const TYPES_REQUIRING_OPTIONS: QuestionType[] = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FREQUENCY'];

const TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Selección única',
  YES_NO: 'Sí / No',
  SCALE_1_5: 'Escala numérica (1-5)',
  RATING_1_5: 'Rating (1-5)',
  MULTIPLE_CHOICE: 'Selección múltiple',
  FREQUENCY: 'Escala de frecuencia',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  CLOSED: 'Finalizada',
};

@Component({
  selector: 'app-survey-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './survey-editor.html',
})
export class SurveyEditor {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveysService = inject(SurveysService);
  private questionsService = inject(QuestionsService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  surveyId = signal<string | null>(null);
  survey = signal<Survey | null>(null);
  loading = signal(false);
  saving = signal(false);

  isAdmin = computed(() => {
    const user = this.authService.currentUser?.();
    return user?.role === 'ADMIN' || user?.role === 'ADMINISTRATOR';
  });

  isOwner(survey: Survey): boolean {
    const user = this.authService.currentUser?.();
    return (survey as { createdBy?: { id: string } })?.createdBy?.id === user?.id;
  }

  showDeleteModal = signal(false);
  deleteTarget = signal<{ id: string; title: string; type: 'question' | 'option' } | null>(null);

  title = '';
  description = '';

  typeLabels = TYPE_LABELS;
  typeOptions = Object.keys(TYPE_LABELS) as QuestionType[];

  newQuestion: DraftQuestion = this.emptyDraft();
  addingQuestion = signal(false);

  editingQuestionId = signal<string | null>(null);
  editDraft: EditDraft = { text: '', required: true, options: [] };
  savingEdit = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.surveyId.set(id);
      this.loadSurvey(id);
    }
  }

  emptyDraft(): DraftQuestion {
    return { text: '', type: 'SINGLE_CHOICE', required: true, options: [{ text: '' }, { text: '' }] };
  }

  needsOptions(type: QuestionType): boolean {
    return TYPES_REQUIRING_OPTIONS.includes(type);
  }

  loadSurvey(id: string) {
    this.loading.set(true);
    this.surveysService.getOne(id).subscribe({
      next: (data) => {
        this.survey.set(data);
        this.title = data.title;
        this.description = data.description ?? '';
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('No se pudo cargar la encuesta.');
        this.loading.set(false);
      },
    });
  }

  saveSurveyInfo() {
    if (!this.title.trim()) {
      this.toastService.error('El título es obligatorio.');
      return;
    }
    this.saving.set(true);

    const payload = { title: this.title.trim(), description: this.description.trim() || undefined };

    const id = this.surveyId();
    if (id) {
      this.surveysService.update(id, payload).subscribe({
        next: (data) => {
          this.survey.set(data);
          this.saving.set(false);
          this.toastService.success('Cambios guardados correctamente.');
        },
        error: () => {
          this.toastService.error('No se pudo guardar.');
          this.saving.set(false);
        },
      });
    } else {
      this.surveysService.create(payload).subscribe({
        next: (data) => {
          this.saving.set(false);
          this.toastService.success('Encuesta creada correctamente.');
          this.router.navigate(['/surveys', data.id, 'edit']);
        },
        error: () => {
          this.toastService.error('No se pudo crear la encuesta.');
          this.saving.set(false);
        },
      });
    }
  }

  onTypeChange() {
    if (this.needsOptions(this.newQuestion.type) && this.newQuestion.options.length < 2) {
      this.newQuestion.options = [{ text: '' }, { text: '' }];
    }
  }

  addOptionField() {
    this.newQuestion.options.push({ text: '' });
  }

  removeOptionField(index: number) {
    if (this.newQuestion.options.length <= 2) {
      this.toastService.error('Se requieren al menos 2 opciones.');
      return;
    }
    this.newQuestion.options.splice(index, 1);
  }

  addQuestion() {
    const id = this.surveyId();
    if (!id) return;

    if (!this.newQuestion.text.trim()) {
      this.toastService.error('El texto de la pregunta es obligatorio.');
      return;
    }

    let options: { text: string }[] | undefined;
    if (this.needsOptions(this.newQuestion.type)) {
      options = this.newQuestion.options.map((o) => ({ text: o.text.trim() })).filter((o) => o.text.length > 0);
      if (options.length < 2) {
        this.toastService.error('Se requieren al menos 2 opciones con texto.');
        return;
      }
    }

    const payload: CreateQuestionPayload = {
      text: this.newQuestion.text.trim(),
      type: this.newQuestion.type,
      required: this.newQuestion.required,
      options,
    };

    this.addingQuestion.set(true);
    this.questionsService.create(id, payload).subscribe({
      next: () => {
        this.newQuestion = this.emptyDraft();
        this.addingQuestion.set(false);
        this.loadSurvey(id);
        this.toastService.success('Pregunta agregada correctamente.');
      },
      error: (err) => {
        this.toastService.error(err?.error?.message ?? 'No se pudo agregar la pregunta.');
        this.addingQuestion.set(false);
      },
    });
  }

  deleteQuestion(questionId: string) {
    const id = this.surveyId();
    if (!id) return;

    const question = this.survey()?.questions.find((q) => q.id === questionId);
    this.deleteTarget.set({
      id: questionId,
      title: question?.text || 'esta pregunta',
      type: 'question',
    });
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;

    if (target.type === 'question') {
      const id = this.surveyId();
      if (!id) return;
      this.questionsService.delete(target.id).subscribe({
        next: () => {
          this.loadSurvey(id);
          this.toastService.success('Pregunta eliminada.');
          this.showDeleteModal.set(false);
          this.deleteTarget.set(null);
        },
        error: () => this.toastService.error('No se pudo eliminar la pregunta.'),
      });
    } else {
      this.questionsService.deleteOption(target.id).subscribe({
        next: () => {
          const questionId = this.editingQuestionId();
          if (questionId) {
            this.editDraft.options = this.editDraft.options.filter((o) => o.id !== target.id);
          }
          this.toastService.success('Opción eliminada.');
          this.showDeleteModal.set(false);
          this.deleteTarget.set(null);
        },
        error: () => this.toastService.error('No se pudo eliminar la opción.'),
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.deleteTarget.set(null);
  }

  publishSurvey() {
    const id = this.surveyId();
    if (id) {
      this.surveysService.publish(id).subscribe({
        next: (data) => {
          this.survey.set(data);
          this.toastService.success('¡Encuesta publicada!');
        },
        error: (err) => this.toastService.error(err?.error?.message ?? 'No se pudo publicar la encuesta.'),
      });
    } else {
      if (!this.title.trim()) {
        this.toastService.error('El título es obligatorio para publicar.');
        return;
      }

      this.saving.set(true);
      const payload = { title: this.title.trim(), description: this.description.trim() || undefined };

      this.surveysService.create(payload).subscribe({
        next: (createdSurvey) => {
          this.surveysService.publish(createdSurvey.id).subscribe({
            next: (publishedSurvey) => {
              this.surveyId.set(publishedSurvey.id);
              this.survey.set(publishedSurvey);
              this.saving.set(false);
              this.toastService.success('¡Encuesta creada y publicada!');
            },
            error: (err) => {
              this.saving.set(false);
              this.toastService.error(err?.error?.message ?? 'La encuesta fue creada pero no se pudo publicar.');
            },
          });
        },
        error: (err) => {
          this.saving.set(false);
          this.toastService.error(err?.error?.message ?? 'No se pudo crear la encuesta.');
        },
      });
    }
  }

  setStatus(status: any) {
    const id = this.surveyId();
    if (!id) return;
    this.surveysService.updateStatus(id, status).subscribe({
      next: (data) => {
        this.survey.set(data);
        this.toastService.success(`Estado actualizado a ${status}`);
      },
      error: (err) => this.toastService.error(err?.error?.message ?? 'No se pudo actualizar el estado.'),
    });
  }

  startEditQuestion(q: SurveyQuestion) {
    this.editingQuestionId.set(q.id);
    this.editDraft = {
      text: q.text,
      required: q.required,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    };
  }

  cancelEditQuestion() {
    this.editingQuestionId.set(null);
  }

  addEditOptionField() {
    this.editDraft.options.push({ text: '' });
  }

  removeEditOptionField(index: number) {
    if (this.editDraft.options.length <= 2) {
      this.toastService.error('Se requieren al menos 2 opciones.');
      return;
    }
    const opt = this.editDraft.options[index];
    if (opt.id) {
      this.deleteTarget.set({
        id: opt.id,
        title: opt.text || 'esta opción',
        type: 'option',
      });
      this.showDeleteModal.set(true);
    } else {
      this.editDraft.options.splice(index, 1);
    }
  }

  saveEditQuestion() {
    const surveyId = this.surveyId();
    const questionId = this.editingQuestionId();
    if (!surveyId || !questionId) return;

    if (!this.editDraft.text.trim()) {
      this.toastService.error('El texto de la pregunta es obligatorio.');
      return;
    }

    this.savingEdit.set(true);

    this.questionsService
      .update(questionId, { text: this.editDraft.text.trim(), required: this.editDraft.required })
      .subscribe({
        next: () => {
          const optionOps = this.editDraft.options
            .filter((o) => o.text.trim().length > 0)
            .map((o) =>
              o.id
                ? this.questionsService.updateOption(o.id, o.text.trim())
                : this.questionsService.addOption(questionId, o.text.trim()),
            );

          if (optionOps.length === 0) {
            this.finishEditQuestion(surveyId);
            return;
          }

          forkJoin(optionOps).subscribe({
            next: () => this.finishEditQuestion(surveyId),
            error: () => {
              this.savingEdit.set(false);
              this.toastService.error('La pregunta se actualizó, pero hubo un error con alguna opción.');
              this.loadSurvey(surveyId);
            },
          });
        },
        error: (err) => {
          this.toastService.error(err?.error?.message ?? 'No se pudo actualizar la pregunta.');
          this.savingEdit.set(false);
        },
      });
  }

  private finishEditQuestion(surveyId: string) {
    this.savingEdit.set(false);
    this.editingQuestionId.set(null);
    this.loadSurvey(surveyId);
    this.toastService.success('Pregunta actualizada correctamente.');
  }
}