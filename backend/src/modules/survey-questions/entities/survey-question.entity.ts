import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { QuestionType } from '../../../common/enums/question-type.enum';
import { Survey } from '../../surveys/entities/survey.entity';
import { QuestionOption } from '../../question-options/entities/question-option.entity';
import { ResponseAnswer } from '../../response-answers/entities/response-answer.entity';

@Entity('survey_questions')
export class SurveyQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Survey,
    (survey: Survey) => survey.questions as SurveyQuestion[],
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column({ default: 0 })
  order: number;

  @Column({ default: false })
  deleted: boolean;

  @OneToMany(
    () => QuestionOption,
    (option: QuestionOption) => option.question as SurveyQuestion,
    { cascade: true },
  )
  options: QuestionOption[];

  @OneToMany(
    () => ResponseAnswer,
    (answer: ResponseAnswer) => answer.question as SurveyQuestion,
  )
  answers: ResponseAnswer[];
}
