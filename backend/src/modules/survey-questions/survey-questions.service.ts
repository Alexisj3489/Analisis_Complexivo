import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { SurveyQuestion } from './entities/survey-question.entity';
import { QuestionOption } from '../question-options/entities/question-option.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionType } from '../../common/enums/question-type.enum';
import { SurveysService } from '../surveys/surveys.service';

const TYPES_REQUIRING_OPTIONS = [
  QuestionType.SINGLE_CHOICE,
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.FREQUENCY,
];

@Injectable()
export class SurveyQuestionsService {
  constructor(
    @InjectRepository(SurveyQuestion)
    private readonly questionRepository: Repository<SurveyQuestion>,
    @InjectRepository(QuestionOption)
    private readonly optionRepository: Repository<QuestionOption>,
    private readonly surveysService: SurveysService,
  ) {}

  async create(
    surveyId: string,
    dto: CreateQuestionDto,
  ): Promise<SurveyQuestion> {
    const survey = await this.surveysService.findOne(surveyId);

    if (TYPES_REQUIRING_OPTIONS.includes(dto.type)) {
      if (!dto.options || dto.options.length < 2) {
        throw new BadRequestException(
          `El tipo de pregunta ${dto.type} requiere al menos 2 opciones`,
        );
      }
    }

    const question = this.questionRepository.create({
      text: dto.text,
      type: dto.type,
      order: dto.order ?? 0,
      required: dto.required ?? true,
      isRequired: dto.required ?? true,
      survey,
      options: dto.options?.map((o, idx) =>
        this.optionRepository.create({
          text: o.text,
          order: o.order ?? idx,
        }),
      ),
    } as DeepPartial<SurveyQuestion>);

    return this.questionRepository.save(question);
  }

  async findOne(id: string): Promise<SurveyQuestion> {
    const question = await this.questionRepository.findOne({
      where: { id, deleted: false },
      relations: {
        options: true,
        survey: true,
      },
    });
    if (!question) {
      throw new NotFoundException(`Pregunta con id ${id} no encontrada`);
    }
    return question;
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<SurveyQuestion> {
    const question = await this.findOne(id);
    Object.assign(question, dto);
    return this.questionRepository.save(question);
  }

  async remove(id: string): Promise<void> {
    const question = await this.findOne(id);
    await this.questionRepository.remove(question);
  }

  async softDelete(id: string): Promise<void> {
    const question = await this.findOne(id);
    question.deleted = true;
    await this.questionRepository.save(question);
  }
}
