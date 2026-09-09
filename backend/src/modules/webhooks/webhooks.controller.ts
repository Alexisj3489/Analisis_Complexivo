import { Controller, Patch, Body } from '@nestjs/common';
import { N8nCallbackDto } from './dto/n8n-callback.dto';
import { SurveyResponsesService } from '../survey-responses/survey-responses.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ProcessingStatus } from '../../common/enums/processing-status.enum';
import { Public } from '../auth/public.decorator';

@Controller('webhooks/n8n')
export class WebhooksController {
  constructor(
    private readonly responsesService: SurveyResponsesService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Public()
  @Patch('callback')
  async handleCallback(@Body() dto: N8nCallbackDto) {
    if (dto.status === ProcessingStatus.COMPLETADO && dto.results) {
      await this.analyticsService.saveResults(dto.surveyId, dto.results);
    }
    await this.responsesService.setStatus(dto.responseId, dto.status);
    return { received: true };
  }
}
