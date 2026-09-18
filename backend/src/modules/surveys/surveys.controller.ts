import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { Public } from '../auth/public.decorator';
import { SurveyStatus } from '../../common/enums/survey-status.enum';
import { Survey } from './entities/survey.entity';

interface AuthenticatedRequest extends Request {
  user?: Record<string, unknown>;
}

@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Post()
  create(@Body() dto: CreateSurveyDto) {
    return this.surveysService.create(dto);
  }

  @Get()
  findAll(
    @Query('title') title?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.surveysService.findAll({ title, status, date });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveysService.findOne(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: SurveyStatus,
    @Req() req: AuthenticatedRequest,
  ): Promise<Survey> {
    return this.surveysService.updateStatus(id, status, req.user);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSurveyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.surveysService.update(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveysService.remove(id);
  }

  @Post(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveysService.publish(id);
  }
}
