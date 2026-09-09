import { IsUUID, IsEnum } from 'class-validator';
import { ReportFormat } from '../../../common/enums/report-format.enum';

export class CreateReportDto {
  @IsUUID()
  surveyId: string;

  @IsEnum(ReportFormat)
  format: ReportFormat;
}
