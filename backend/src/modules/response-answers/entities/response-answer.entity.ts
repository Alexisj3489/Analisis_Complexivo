import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SurveyResponse } from '../../survey-responses/entities/survey-response.entity';
import { SurveyQuestion } from '../../survey-questions/entities/survey-question.entity';
import { QuestionOption } from '../../question-options/entities/question-option.entity';

@Entity('response_answers')
export class ResponseAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => SurveyResponse,
    (response: SurveyResponse) => response.answers as ResponseAnswer[],
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;

  @ManyToOne(
    () => SurveyQuestion,
    (question: SurveyQuestion) => question.answers as ResponseAnswer[],
  )
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestion;

  @ManyToOne(() => QuestionOption, { nullable: true })
  @JoinColumn({ name: 'option_id' })
  option: QuestionOption | null;

  @Column({ type: 'float', nullable: true })
  numeric_value: number | null;
}
