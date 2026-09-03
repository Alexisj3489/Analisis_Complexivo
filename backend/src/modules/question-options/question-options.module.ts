import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionOption } from './entities/question-option.entity';
import { SurveyQuestion } from '../survey-questions/entities/survey-question.entity';
import { QuestionOptionsService } from './question-options.service';
import { QuestionOptionsController } from './question-options.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionOption, SurveyQuestion])],
  controllers: [QuestionOptionsController],
  providers: [QuestionOptionsService],
  exports: [QuestionOptionsService],
})
export class QuestionOptionsModule {}
