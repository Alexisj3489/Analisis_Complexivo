import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SurveyQuestion } from '../../survey-questions/entities/survey-question.entity';
import { ResponseAnswer } from '../../response-answers/entities/response-answer.entity';

@Entity('question_options')
export class QuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => SurveyQuestion,
    (question: SurveyQuestion) => question.options as QuestionOption[],
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestion;

  @Column({ type: 'text' })
  text: string;

  @Column({ default: 0 })
  order: number;

  @OneToMany(
    () => ResponseAnswer,
    (answer: ResponseAnswer) => answer.option as QuestionOption,
  )
  answers: ResponseAnswer[];
}
