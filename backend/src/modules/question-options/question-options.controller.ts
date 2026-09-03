import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuestionOptionsService } from './question-options.service';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';

@Controller()
export class QuestionOptionsController {
  constructor(private readonly optionsService: QuestionOptionsService) {}

  @Post('questions/:questionId/options')
  create(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: CreateOptionDto,
  ) {
    return this.optionsService.addOption(questionId, dto);
  }

  @Put('options/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOptionDto) {
    return this.optionsService.update(id, dto);
  }

  @Delete('options/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.optionsService.remove(id);
  }
}
