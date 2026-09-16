import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SurveysService } from '../../../services/surveys.service';
import { ResponsesService, AnswerPayload } from '../../../services/responses.service';
import { Survey, SurveyQuestion } from '../../../models/survey.model';

interface AnswerState {
  optionId?: string;
  optionIds: string[];
  numericValue?: number;
  boolValue?: boolean;
}

@Component({
  selector: 'app-survey-answer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey-answer.html',
})
export class SurveyAnswer {
  private route = inject(ActivatedRoute);
  private surveysService = inject(SurveysService);
  private responsesService = inject(ResponsesService);

  survey = signal<Survey | null>(null);
  loading = signal(true);
  loadError = signal(false);
  submitting = signal(false);
  submitted = signal(false);
  submitError = signal<string | null>(null);

  answers: Record<string, AnswerState> = {};
  scaleValues = [1, 2, 3, 4, 5];

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    } else {
      this.loading.set(false);
      this.loadError.set(true);
    }
  }

  load(id: string) {
    this.loading.set(true);
    this.surveysService.getOne(id).subscribe({
      next: (data) => {
        if (data.status !== 'PUBLISHED') {
          this.loadError.set(true);
          this.loading.set(false);
          return;
        }
        this.survey.set(data);
        for (const q of data.questions) {
          this.answers[q.id] = { optionIds: [] };
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleMultiple(questionId: string, optionId: string, checked: boolean) {
    const state = this.answers[questionId];
    if (checked) {
      if (!state.optionIds.includes(optionId)) state.optionIds.push(optionId);
    } else {
      state.optionIds = state.optionIds.filter((id) => id !== optionId);
    }
  }

  isChecked(questionId: string, optionId: string): boolean {
    return this.answers[questionId]?.optionIds.includes(optionId) ?? false;
  }

  isAnswered(q: SurveyQuestion): boolean {
    const a = this.answers[q.id];
    if (!a) return false;
    switch (q.type) {
      case 'SINGLE_CHOICE':
      case 'FREQUENCY':
        return !!a.optionId;
      case 'MULTIPLE_CHOICE':
        return a.optionIds.length > 0;
      case 'SCALE_1_5':
      case 'RATING_1_5':
        return a.numericValue !== undefined;
      case 'YES_NO':
        return a.boolValue !== undefined;
      default:
        return false;
    }
  }

  answeredCount(): number {
    const survey = this.survey();
    if (!survey) return 0;
    return survey.questions.filter((q) => this.isAnswered(q)).length;
  }

  getScaleColor(value: number): string {
    const colors: Record<number, string> = {
      1: 'text-red-500',
      2: 'text-orange-500',
      3: 'text-yellow-500',
      4: 'text-emerald-500',
      5: 'text-green-500',
    };
    return colors[value] ?? 'text-zinc-400';
  }

  submit() {
    const survey = this.survey();
    if (!survey) return;

    const missing = survey.questions.filter((q) => q.required && !this.isAnswered(q));
    if (missing.length > 0) {
      this.submitError.set(`Falta responder: "${missing[0].text}"`);
      return;
    }

    const payload: AnswerPayload[] = [];
    for (const q of survey.questions) {
      if (!this.isAnswered(q)) continue;
      const a = this.answers[q.id];

      switch (q.type) {
        case 'SINGLE_CHOICE':
        case 'FREQUENCY':
          payload.push({ questionId: q.id, optionId: a.optionId });
          break;
        case 'MULTIPLE_CHOICE':
          payload.push({ questionId: q.id, optionIds: a.optionIds });
          break;
        case 'SCALE_1_5':
        case 'RATING_1_5':
          payload.push({ questionId: q.id, value: a.numericValue });
          break;
        case 'YES_NO':
          payload.push({ questionId: q.id, value: a.boolValue });
          break;
      }
    }

    this.submitting.set(true);
    this.submitError.set(null);
    this.responsesService.submit(survey.id, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? 'No se pudo enviar la respuesta.');
      },
    });
  }
}