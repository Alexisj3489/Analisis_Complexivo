import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^(?!\d+$).+$/, {
    message: 'El título no puede consistir solo en números',
  })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
