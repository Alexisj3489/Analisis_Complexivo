import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Public } from '../auth/public.decorator';

@Controller('surveys/:surveyId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Get()
  findBySurvey(@Param('surveyId', ParseUUIDPipe) surveyId: string) {
    return this.analyticsService.findBySurvey(surveyId);
  }
}
