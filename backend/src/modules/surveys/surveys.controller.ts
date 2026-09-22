import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('deleted') deleted?: boolean,
    @Req() req?: AuthenticatedRequest,
  ): Promise<void> {
    if (deleted === false) {
      await (
        this.surveysService.update as (
          id: string,
          dto: UpdateSurveyDto,
          user?: Record<string, unknown>,
        ) => Promise<unknown>
      )(id, { deleted } as unknown as UpdateSurveyDto, req?.user);
    } else {
      await (
        this.surveysService.softDelete as (id: string) => Promise<unknown>
      )(id);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await (this.surveysService.remove as (id: string) => Promise<unknown>)(id);
  }

  @Post(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.surveysService.publish(id);
  }
}
