import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer'; // Carga los tipos de Multer en el namespace global de Express
import { ImportsService, ImportSummary } from './imports.service';

@Controller('surveys/:surveyId/import')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportSummary> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    return this.importsService.importResponses(surveyId, file);
  }
}
