import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SurveyStatus } from '../../../common/enums/survey-status.enum';
import { User } from '../../users/entities/user.entity';
import { SurveyQuestion } from '../../survey-questions/entities/survey-question.entity';
import { SurveyResponse } from '../../survey-responses/entities/survey-response.entity';
import { Report } from '../../reports/entities/report.entity';

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: SurveyStatus, default: SurveyStatus.DRAFT })
  status: SurveyStatus;

  @ManyToOne(() => User, (user: User) => user.surveys as Survey[])
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(
    () => SurveyQuestion,
    (question: SurveyQuestion) => question.survey as Survey,
    { cascade: true },
  )
  questions: SurveyQuestion[];

  @OneToMany(
    () => SurveyResponse,
    (response: SurveyResponse) => response.survey as Survey,
  )
  responses: SurveyResponse[];

  @OneToMany(() => Report, (report: Report) => report.survey as Survey)
  reports: Report[];
}
