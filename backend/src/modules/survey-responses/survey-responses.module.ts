import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyResponse } from './entities/survey-response.entity';
import { ResponseAnswer } from '../response-answers/entities/response-answer.entity';
import { SurveyResponsesService } from './survey-responses.service';
import { SurveyResponsesController } from './survey-responses.controller';
import { SurveysModule } from '../surveys/surveys.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SurveyResponse, ResponseAnswer]),
    SurveysModule,
  ],
  controllers: [SurveyResponsesController],
  providers: [SurveyResponsesService],
  exports: [SurveyResponsesService],
})
export class SurveyResponsesModule {}
