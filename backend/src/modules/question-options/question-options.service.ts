import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { QuestionOption } from './entities/question-option.entity';
import { SurveyQuestion } from '../survey-questions/entities/survey-question.entity';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';

@Injectable()
export class QuestionOptionsService {
  constructor(
    @InjectRepository(QuestionOption)
    private readonly optionRepository: Repository<QuestionOption>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepository: Repository<SurveyQuestion>,
  ) {}

  async addOption(
    questionId: string,
    dto: CreateOptionDto,
  ): Promise<QuestionOption> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException(
        `Pregunta con id ${questionId} no encontrada`,
      );
    }

    const optionData: DeepPartial<QuestionOption> = {
      text: dto.text,
      order: dto.order ?? 0,
      question,
    };

    const option = this.optionRepository.create(optionData);
    return this.optionRepository.save(option);
  }

  async update(id: string, dto: UpdateOptionDto): Promise<QuestionOption> {
    const option = await this.optionRepository.findOne({ where: { id } });
    if (!option) {
      throw new NotFoundException(`Opción con id ${id} no encontrada`);
    }
    Object.assign(option, dto);
    return this.optionRepository.save(option);
  }

  async remove(id: string): Promise<void> {
    const option = await this.optionRepository.findOne({ where: { id } });
    if (!option) {
      throw new NotFoundException(`Opción con id ${id} no encontrada`);
    }
    await this.optionRepository.remove(option);
  }
}
