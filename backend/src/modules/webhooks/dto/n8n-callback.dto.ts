import {
  IsUUID,
  IsString,
  IsInt,
  IsObject,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessingStatus } from '../../../common/enums/processing-status.enum';

export class QuestionResultDto {
  @IsUUID()
  questionId: string;

  @IsString()
  questionText: string;

  @IsString()
  type: string;

  @IsInt()
  totalResponses: number;

  @IsObject()
  frequencyTable: Record<string, number>;

  @IsObject()
  percentageTable: Record<string, number>;

  @IsOptional()
  @IsNumber()
  average?: number;

  @IsOptional()
  mode?: string[] | number[];

  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;
}

export class N8nCallbackDto {
  @IsUUID()
  surveyId: string;

  @IsUUID()
  responseId: string;

  @IsEnum(ProcessingStatus)
  status: ProcessingStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionResultDto)
  results?: QuestionResultDto[];

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
