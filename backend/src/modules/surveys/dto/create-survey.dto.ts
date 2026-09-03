import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
