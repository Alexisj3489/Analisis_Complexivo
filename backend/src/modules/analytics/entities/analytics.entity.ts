import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Survey } from '../../surveys/entities/survey.entity';
import { SurveyQuestion } from '../../survey-questions/entities/survey-question.entity';

@Entity('analytics')
export class Analytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @ManyToOne(() => SurveyQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: SurveyQuestion;

  @Column({ default: 0 })
  total_responses: number;

  @Column({ type: 'jsonb', nullable: true })
  frequency_table: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  percentage_table: Record<string, number>;

  @Column({ type: 'float', nullable: true })
  average: number | null;

  @Column({ type: 'jsonb', nullable: true })
  mode: string[] | number[] | null;

  @Column({ type: 'float', nullable: true })
  min: number | null;

  @Column({ type: 'float', nullable: true })
  max: number | null;

  @CreateDateColumn()
  calculated_at: Date;
}
