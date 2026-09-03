import {
  Controller,
  Post,
  Put,
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

  @Delete('questions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.remove(id);
  }
}
