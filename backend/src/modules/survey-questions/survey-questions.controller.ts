import {
  Controller,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SurveyQuestionsService } from './survey-questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller()
export class SurveyQuestionsController {
  constructor(private readonly questionsService: SurveyQuestionsService) {}

  @Post('surveys/:surveyId/questions')
  create(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(surveyId, dto);
  }

  @Put('questions/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, dto);
  }

  @Patch('questions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('deleted') deleted?: boolean,
  ): Promise<void> {
    if (deleted === false) {
      await (
        this.questionsService.update as (
          id: string,
          dto: UpdateQuestionDto,
        ) => Promise<unknown>
      )(id, { deleted } as unknown as UpdateQuestionDto);
    } else {
      await (
        this.questionsService.softDelete as (id: string) => Promise<unknown>
      )(id);
    }
  }

  @Delete('questions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await (this.questionsService.remove as (id: string) => Promise<unknown>)(
      id,
    );
  }
}
