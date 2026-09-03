import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProcessingStatus } from '../../../common/enums/processing-status.enum';
import { ResponseSource } from '../../../common/enums/response-source.enum';
import { Survey } from '../../surveys/entities/survey.entity';
import { ResponseAnswer } from '../../response-answers/entities/response-answer.entity';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Survey,
    (survey: Survey) => survey.responses as SurveyResponse[],
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ nullable: true })
  respondent_ref: string;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDIENTE,
  })
  status: ProcessingStatus;

  @Column({ type: 'enum', enum: ResponseSource, default: ResponseSource.WEB })
  source: ResponseSource;

  @CreateDateColumn()
  submitted_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;

  @OneToMany(
    () => ResponseAnswer,
    (answer: ResponseAnswer) => answer.response as SurveyResponse,
    { cascade: true },
  )
  answers: ResponseAnswer[];
}
