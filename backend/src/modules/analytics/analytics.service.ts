import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analytics } from './entities/analytics.entity';
import { Survey } from '../surveys/entities/survey.entity';
import { SurveyQuestion } from '../survey-questions/entities/survey-question.entity';
import { QuestionResultDto } from '../webhooks/dto/n8n-callback.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly analyticsRepository: Repository<Analytics>,
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepository: Repository<SurveyQuestion>,
  ) {}

  async saveResults(
    surveyId: string,
    results: QuestionResultDto[],
  ): Promise<void> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
    });
    if (!survey) {
      throw new NotFoundException(`Encuesta ${surveyId} no encontrada`);
    }

    for (const result of results) {
      const question = await this.questionRepository.findOne({
        where: { id: result.questionId },
      });
      if (!question) continue;

      let analytics = await this.analyticsRepository.findOne({
        where: {
          survey: { id: surveyId },
          question: { id: result.questionId },
        },
      });
      if (!analytics) {
        analytics = this.analyticsRepository.create({ survey, question });
      }

      analytics.total_responses = result.totalResponses;
      analytics.frequency_table = result.frequencyTable;
      analytics.percentage_table = result.percentageTable;
      analytics.average = result.average ?? null;
      analytics.mode = result.mode ?? null;
      analytics.min = result.min ?? null;
      analytics.max = result.max ?? null;

      await this.analyticsRepository.save(analytics);
    }
  }

  async findBySurvey(surveyId: string) {
    return this.analyticsRepository.find({
      where: { survey: { id: surveyId } },
      relations: {
        question: true,
      },
    });
  }
}
