import { Injectable, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SurveysService } from '../surveys/surveys.service';
import { SurveyResponsesService } from '../survey-responses/survey-responses.service';
import { QuestionType } from '../../common/enums/question-type.enum';
import { AnswerDto } from '../survey-responses/dto/create-response.dto';
import { Survey } from '../surveys/entities/survey.entity';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportSummary {
  totalRows: number;
  imported: number;
  failed: number;
  errors: ImportRowError[];
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly surveysService: SurveysService,
    private readonly surveyResponsesService: SurveyResponsesService,
  ) {}

  async importResponses(
    surveyId: string,
    file: Express.Multer.File,
  ): Promise<ImportSummary> {
    const survey = await this.surveysService.findOne(surveyId);
    const rows = this.parseFile(file);

    if (rows.length === 0) {
      throw new BadRequestException('El archivo no contiene filas de datos');
    }

    // Mapa para asociar encabezados normalizados con su nombre real en la fila
    const headers = Object.keys(rows[0]);
    const headerMap = new Map<string, string>();
    for (const header of headers) {
      headerMap.set(this.normalizeText(header), header);
    }

    // Verificar la existencia de columnas para cada pregunta usando comparación flexible
    const missingColumns: string[] = [];
    for (const question of survey.questions) {
      const normQuestionText = this.normalizeText(question.text);
      if (!headerMap.has(normQuestionText)) {
        missingColumns.push(question.text);
      }
    }

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Faltan columnas para las preguntas: ${missingColumns.join(', ')}`,
      );
    }

    const summary: ImportSummary = {
      totalRows: rows.length,
      imported: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      try {
        const answers = this.mapRowToAnswers(survey, rows[i], headerMap);
        await this.surveyResponsesService.createFromImport(survey, answers);
        summary.imported++;
      } catch (err: unknown) {
        summary.failed++;
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido';
        summary.errors.push({
          row: i + 2, // Fila 1 es el encabezado en el CSV/Excel
          message: errorMessage,
        });
      }
    }

    return summary;
  }

  private parseFile(file: Express.Multer.File): Record<string, string>[] {
    const filename = file.originalname.toLowerCase();

    if (filename.endsWith('.csv')) {
      let text = file.buffer.toString('utf-8');
      text = text.replace(/^\uFEFF/, ''); // remueve BOM de Windows/Excel
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });
      if (result.errors.length > 0) {
        throw new BadRequestException(
          `Error al leer el CSV: ${result.errors[0].message}`,
        );
      }
      return result.data;
    }

    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: '',
      });
    }

    throw new BadRequestException(
      'Formato de archivo no soportado. Usa .csv o .xlsx',
    );
  }

  private mapRowToAnswers(
    survey: Survey,
    row: Record<string, string>,
    headerMap: Map<string, string>,
  ): AnswerDto[] {
    const answers: AnswerDto[] = [];

    for (const question of survey.questions) {
      const normQuestionText = this.normalizeText(question.text);
      const actualHeader = headerMap.get(normQuestionText);
      const rawValue = ((actualHeader ? row[actualHeader] : '') ?? '')
        .toString()
        .trim();

      if (rawValue === '') {
        if (question.required) {
          throw new Error(
            `Falta valor para la pregunta obligatoria: ${question.text}`,
          );
        }
        continue;
      }

      switch (question.type) {
        case QuestionType.YES_NO: {
          const normalized = this.normalizeText(rawValue);
          if (!['si', 'no', 'true', 'false'].includes(normalized)) {
            throw new Error(
              `Valor inválido para "${question.text}": ${rawValue}`,
            );
          }
          const value = normalized === 'si' || normalized === 'true';
          answers.push({ questionId: question.id, value });
          break;
        }

        case QuestionType.SCALE_1_5:
        case QuestionType.RATING_1_5: {
          const num = Number(rawValue);
          if (isNaN(num) || num < 1 || num > 5) {
            throw new Error(
              `Valor inválido (1-5) para "${question.text}": ${rawValue}`,
            );
          }
          answers.push({ questionId: question.id, value: num });
          break;
        }

        case QuestionType.SINGLE_CHOICE:
        case QuestionType.FREQUENCY: {
          const normRawValue = this.normalizeText(rawValue);
          const option = question.options?.find(
            (o) => this.normalizeText(o.text) === normRawValue,
          );
          if (!option) {
            throw new Error(
              `Opción "${rawValue}" no existe para "${question.text}"`,
            );
          }
          answers.push({ questionId: question.id, optionId: option.id });
          break;
        }

        case QuestionType.MULTIPLE_CHOICE: {
          const labels = rawValue
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean);
          const optionIds: string[] = [];

          for (const label of labels) {
            const normLabel = this.normalizeText(label);
            const option = question.options?.find(
              (o) => this.normalizeText(o.text) === normLabel,
            );
            if (!option) {
              throw new Error(
                `Opción "${label}" no existe para "${question.text}"`,
              );
            }
            optionIds.push(option.id);
          }
          answers.push({ questionId: question.id, optionIds });
          break;
        }
      }
    }

    return answers;
  }

  /**
   * Normaliza una cadena removiendo tildes, espacios innecesarios y convirtiendo a minúsculas.
   */
  private normalizeText(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
