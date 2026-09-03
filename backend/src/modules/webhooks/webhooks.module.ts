import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { SurveyResponsesModule } from '../survey-responses/survey-responses.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [SurveyResponsesModule, AnalyticsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
