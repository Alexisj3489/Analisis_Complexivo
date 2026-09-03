import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}
