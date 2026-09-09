import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SurveyResponsesService } from './survey-responses.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { Public } from '../auth/public.decorator';

@Controller()
export class SurveyResponsesController {
  constructor(private readonly responsesService: SurveyResponsesService) {}

  @Public()
  @Post('surveys/:surveyId/responses')
  create(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @Body() dto: CreateResponseDto,
  ) {
    return this.responsesService.create(surveyId, dto);
  }

  @Get('responses/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.responsesService.findOne(id);
  }

  @Post('responses/:id/retry')
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.responsesService.retry(id);
  }
}
