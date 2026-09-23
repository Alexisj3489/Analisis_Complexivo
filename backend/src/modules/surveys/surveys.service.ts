import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, Between } from 'typeorm';
import { Survey } from './entities/survey.entity';
import { SurveyBackup } from './entities/survey-backup.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SurveyStatus } from '../../common/enums/survey-status.enum';

export interface CurrentUser {
  userId?: string;
  role?: string;
  [key: string]: unknown;
}

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyBackup)
    private readonly backupRepository: Repository<SurveyBackup>,
  ) {}

  async create(dto: CreateSurveyDto): Promise<Survey> {
    const surveyData: Partial<Survey> = {
      ...dto,
      status: SurveyStatus.DRAFT,
    };
    const survey = this.surveyRepository.create(surveyData);
    return this.surveyRepository.save(survey);
  }

  async findAll(query?: {
    title?: string;
    status?: string;
    date?: string;
  }): Promise<Survey[]> {
    const where: FindOptionsWhere<Survey> = {};
    if (query?.title) {
      where.title = ILike(`%${query.title}%`);
    }
    if (query?.status) {
      where.status = query.status as SurveyStatus;
    }
    if (query?.date) {
      const [year, month, day] = query.date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      where.created_at = Between(startOfDay, endOfDay);
    }
    where.deleted = false;

    return this.surveyRepository.find({
      where,
      relations: {
        createdBy: true,
        questions: true,
        responses: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Survey> {
    console.log(`Searching for survey with id: ${id}`);
    const survey = await this.surveyRepository.findOne({
      where: { id, deleted: false },
      relations: {
        createdBy: true,
        questions: {
          options: true,
        },
        responses: true,
      },
    });
    if (!survey) {
      console.log(`Survey not found for id: ${id}`);
      throw new NotFoundException(`Encuesta con id ${id} no encontrada`);
    }
    return survey;
  }

  async update(
    id: string,
    dto: UpdateSurveyDto,
    user?: CurrentUser,
  ): Promise<Survey> {
    const survey = await this.findOne(id);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'ADMINISTRATOR';
    const isOwner =
      survey.createdBy?.id === user?.userId ||
      survey.createdBy?.id === user?.id;

    // El administrador puede editar cualquier cosa.
    // El usuario puede editar la encuesta si es el dueño, sin importar si está publicada.
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'No tienes permiso para editar esta encuesta.',
      );
    }

    // Actualización explícita para asegurar persistencia
    if (dto.status) {
      survey.status = dto.status;
    }
    if (dto.title) {
      survey.title = dto.title;
    }
    if (dto.description !== undefined) {
      survey.description = dto.description;
    }

    return await this.surveyRepository.save(survey);
  }

  async updateStatus(
    id: string,
    status: SurveyStatus,
    user?: CurrentUser,
  ): Promise<Survey> {
    const survey = await this.findOne(id);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'ADMINISTRATOR';
    const isOwner =
      survey.createdBy?.id === user?.userId ||
      survey.createdBy?.id === user?.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'No tienes permiso para cambiar el estado de la encuesta.',
      );
    }

    survey.status = status;
    return await this.surveyRepository.save(survey);
  }

  async remove(id: string): Promise<void> {
    const survey = await this.findOne(id);
    await this.surveyRepository.remove(survey);
  }

  async softDelete(id: string): Promise<void> {
    const survey = await this.findOne(id);
    survey.deleted = true;
    await this.surveyRepository.save(survey);
  }

  async createBackup(id: string): Promise<SurveyBackup> {
    const survey = await this.findOne(id);
    const backup = this.backupRepository.create({
      survey,
      snapshot: survey,
    });
    return this.backupRepository.save(backup);
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
