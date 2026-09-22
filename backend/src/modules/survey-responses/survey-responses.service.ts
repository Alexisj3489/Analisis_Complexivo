import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SurveyResponse } from './entities/survey-response.entity';
import { ResponseAnswer } from '../response-answers/entities/response-answer.entity';
import { CreateResponseDto, AnswerDto } from './dto/create-response.dto';
import { SurveysService } from '../surveys/surveys.service';
import { ProcessingStatus } from '../../common/enums/processing-status.enum';
import { ResponseSource } from '../../common/enums/response-source.enum';
import { QuestionType } from '../../common/enums/question-type.enum';
import { SurveyStatus } from '../../common/enums/survey-status.enum';
import { Survey } from '../surveys/entities/survey.entity';

@Injectable()
export class SurveyResponsesService {
  private readonly logger = new Logger(SurveyResponsesService.name);

  constructor(
    @InjectRepository(SurveyResponse)
    private readonly responseRepository: Repository<SurveyResponse>,
    @InjectRepository(ResponseAnswer)
    private readonly answerRepository: Repository<ResponseAnswer>,
    private readonly surveysService: SurveysService,
    private readonly config: ConfigService,
  ) {}

  async create(
    surveyId: string,
    dto: CreateResponseDto,
  ): Promise<SurveyResponse> {
    const survey = await this.surveysService.findOne(surveyId);

    if (survey.status !== SurveyStatus.PUBLISHED) {
      throw new BadRequestException(
        'La encuesta no está publicada, no admite respuestas',
      );
    }

    const { entities, answeredQuestionIds } = this.buildAnswerEntities(
      survey,
      dto.answers,
    );
    this.checkRequiredAnswered(survey, answeredQuestionIds);

    const response = this.responseRepository.create({
      survey,
      status: ProcessingStatus.PENDIENTE,
      source: ResponseSource.WEB,
      respondent_ref: dto.respondentRef,
      answers: entities,
    });

    const saved = await this.responseRepository.save(response);
    await this.triggerN8nWebhook(saved.id);
    return this.findOne(saved.id);
  }

  async createFromImport(
    survey: Survey,
    answers: AnswerDto[],
    respondentRef?: string,
  ): Promise<SurveyResponse> {
    const { entities, answeredQuestionIds } = this.buildAnswerEntities(
      survey,
      answers,
    );
    this.checkRequiredAnswered(survey, answeredQuestionIds);

    const response = this.responseRepository.create({
      survey,
      status: ProcessingStatus.PENDIENTE,
      source: ResponseSource.IMPORT,
      respondent_ref: respondentRef,
      answers: entities,
    });

    const saved = await this.responseRepository.save(response);
    await this.triggerN8nWebhook(saved.id);
    return this.findOne(saved.id);
  }

  private buildAnswerEntities(
    survey: Survey,
    answers: AnswerDto[],
  ): { entities: ResponseAnswer[]; answeredQuestionIds: Set<string> } {
    const answeredQuestionIds = new Set<string>();
    const answerEntities: ResponseAnswer[] = [];

    for (const answerDto of answers) {
      if (answeredQuestionIds.has(answerDto.questionId)) {
        throw new BadRequestException(
          `Respuesta duplicada para la pregunta ${answerDto.questionId}`,
        );
      }
      answeredQuestionIds.add(answerDto.questionId);

      const question = survey.questions.find(
        (q) => q.id === answerDto.questionId,
      );
      if (!question) {
        throw new BadRequestException(
          `La pregunta ${answerDto.questionId} no pertenece a esta encuesta`,
        );
      }

      switch (question.type) {
        case QuestionType.YES_NO: {
          if (typeof answerDto.value !== 'boolean') {
            throw new BadRequestException(
              `Respuesta inválida para pregunta Sí/No: ${question.text}`,
            );
          }
          answerEntities.push(
            this.answerRepository.create({
              question,
              numeric_value: answerDto.value ? 1 : 0,
            }),
          );
          break;
        }
        case QuestionType.SCALE_1_5:
        case QuestionType.RATING_1_5: {
          const val = answerDto.value;
          if (typeof val !== 'number' || val < 1 || val > 5) {
            throw new BadRequestException(
              `Respuesta inválida (1-5) para: ${question.text}`,
            );
          }
          answerEntities.push(
            this.answerRepository.create({ question, numeric_value: val }),
          );
          break;
        }
        case QuestionType.SINGLE_CHOICE:
        case QuestionType.FREQUENCY: {
          const option = question.options?.find(
            (o) => o.id === answerDto.optionId,
          );
          if (!option) {
            throw new BadRequestException(
              `Opción inexistente para: ${question.text}`,
            );
          }
          answerEntities.push(
            this.answerRepository.create({ question, option }),
          );
          break;
        }
        case QuestionType.MULTIPLE_CHOICE: {
          if (!answerDto.optionIds || answerDto.optionIds.length === 0) {
            throw new BadRequestException(
              `Selecciona al menos una opción para: ${question.text}`,
            );
          }
          for (const optId of answerDto.optionIds) {
            const option = question.options?.find((o) => o.id === optId);
            if (!option) {
              throw new BadRequestException(
                `Opción inexistente (${optId}) para: ${question.text}`,
              );
            }
            answerEntities.push(
              this.answerRepository.create({ question, option }),
            );
          }
          break;
        }
      }
    }

    return { entities: answerEntities, answeredQuestionIds };
  }

  private checkRequiredAnswered(
    survey: Survey,
    answeredQuestionIds: Set<string>,
  ): void {
    const requiredQuestions = survey.questions.filter((q) => {
      const qObj = q as unknown as { required?: boolean; isRequired?: boolean };
      return qObj.required ?? qObj.isRequired ?? false;
    });

    for (const rq of requiredQuestions) {
      if (!answeredQuestionIds.has(rq.id)) {
        throw new BadRequestException(
          `Falta respuesta obligatoria: ${rq.text}`,
        );
      }
    }
  }

  async findOne(id: string): Promise<SurveyResponse> {
    const response = await this.responseRepository.findOne({
      where: { id },
      relations: {
        survey: true,
        answers: {
          question: true,
          option: true,
        },
      },
    });
    if (!response) {
      throw new NotFoundException(`Respuesta con id ${id} no encontrada`);
    }
    return response;
  }

  async retry(id: string): Promise<SurveyResponse> {
    await this.findOne(id);
    await this.responseRepository.update(id, {
      status: ProcessingStatus.PENDIENTE,
    });
    await this.triggerN8nWebhook(id);
    return this.findOne(id);
  }

  async setStatus(id: string, status: ProcessingStatus): Promise<void> {
    await this.responseRepository.update(id, {
      status,
      processed_at:
        status === ProcessingStatus.COMPLETADO ||
        status === ProcessingStatus.FALLIDO
          ? new Date()
          : undefined,
    });
  }

  private async triggerN8nWebhook(responseId: string): Promise<void> {
    const response = await this.findOne(responseId);
    const webhookUrl = this.config.get<string>('N8N_WEBHOOK_URL');

    if (!webhookUrl) {
      this.logger.error('La variable N8N_WEBHOOK_URL no está definida.');
      await this.responseRepository.update(responseId, {
        status: ProcessingStatus.FALLIDO,
      });
      return;
    }

    const payload = {
      surveyId: response.survey.id,
      responseId: response.id,
      source: response.source,
      answers: response.answers.map((a) => ({
        questionId: a.question.id,
        type: a.question.type,
        optionId: a.option?.id,
        numericValue: a.numeric_value,
      })),
    };

    try {
      await this.responseRepository.update(responseId, {
        status: ProcessingStatus.PROCESANDO,
      });

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`n8n respondió con status ${res.status}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Fallo al notificar a n8n para response ${responseId}: ${errorMessage}`,
      );
      await this.responseRepository
        .createQueryBuilder()
        .update(SurveyResponse)
        .set({ status: ProcessingStatus.FALLIDO, processed_at: new Date() })
        .where('id = :id', { id: responseId })
        .andWhere('status != :completado', {
          completado: ProcessingStatus.COMPLETADO,
        })
        .execute();
    }
  }
}
