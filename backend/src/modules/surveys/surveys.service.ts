import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './entities/survey.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SurveyStatus } from '../../common/enums/survey-status.enum';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
  ) {}

  async create(dto: CreateSurveyDto): Promise<Survey> {
    const surveyData: Partial<Survey> = {
      ...dto,
      status: SurveyStatus.DRAFT,
    };
    const survey = this.surveyRepository.create(surveyData);
    return this.surveyRepository.save(survey);
  }

  async findAll(): Promise<Survey[]> {
    return this.surveyRepository.find({
      relations: {
        questions: true,
        responses: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Survey> {
    const survey = await this.surveyRepository.findOne({
      where: { id },
      relations: {
        questions: {
          options: true,
        },
        responses: true,
      },
    });
    if (!survey) {
      throw new NotFoundException(`Encuesta con id ${id} no encontrada`);
    }
    return survey;
  }

  async update(id: string, dto: UpdateSurveyDto): Promise<Survey> {
    const survey = await this.findOne(id);
    Object.assign(survey, dto);
    return this.surveyRepository.save(survey);
  }

  async remove(id: string): Promise<void> {
    const survey = await this.findOne(id);
    await this.surveyRepository.remove(survey);
  }

  async publish(id: string): Promise<Survey> {
    const survey = await this.findOne(id);

    if (!survey.questions || survey.questions.length === 0) {
      throw new BadRequestException(
        'No se puede publicar una encuesta sin preguntas',
      );
    }

    const hasQuestionWithoutOptions = survey.questions.some(
      (q) =>
        ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.type) &&
        (!q.options || q.options.length === 0),
    );
    if (hasQuestionWithoutOptions) {
      throw new BadRequestException(
        'Hay preguntas de selección sin opciones configuradas',
      );
    }

    survey.status = SurveyStatus.PUBLISHED;
    return this.surveyRepository.save(survey);
  }
}
