import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('surveys/:surveyId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  findBySurvey(@Param('surveyId', ParseUUIDPipe) surveyId: string) {
    return this.analyticsService.findBySurvey(surveyId);
  }
}
