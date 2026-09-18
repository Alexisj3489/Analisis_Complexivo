import { PartialType } from '@nestjs/mapped-types';
import { CreateSurveyDto } from './create-survey.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { SurveyStatus } from '../../../common/enums/survey-status.enum';

export class UpdateSurveyDto extends PartialType(CreateSurveyDto) {
  @IsOptional()
  @IsEnum(SurveyStatus)
  status?: SurveyStatus;
}
