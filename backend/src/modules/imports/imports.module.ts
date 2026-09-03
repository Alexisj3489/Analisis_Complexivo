import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { SurveysModule } from '../surveys/surveys.module';
import { SurveyResponsesModule } from '../survey-responses/survey-responses.module';

@Module({
  imports: [SurveysModule, SurveyResponsesModule],
  controllers: [ImportsController],
  providers: [ImportsService],
})
export class ImportsModule {}
