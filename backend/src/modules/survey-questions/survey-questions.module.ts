import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyQuestion } from './entities/survey-question.entity';
import { QuestionOption } from '../question-options/entities/question-option.entity';
import { SurveyQuestionsService } from './survey-questions.service';
import { SurveyQuestionsController } from './survey-questions.controller';
import { SurveysModule } from '../surveys/surveys.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SurveyQuestion, QuestionOption]),
    SurveysModule,
  ],
  controllers: [SurveyQuestionsController],
  providers: [SurveyQuestionsService],
  exports: [SurveyQuestionsService],
})
export class SurveyQuestionsModule {}
