import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ReportFormat } from '../../../common/enums/report-format.enum';
import { Survey } from '../../surveys/entities/survey.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Survey, (survey: Survey) => survey.reports as Report[], {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ type: 'enum', enum: ReportFormat })
  format: ReportFormat;

  @Column()
  file_path: string;

  @ManyToOne(() => User, (user: User) => user.reports as Report[])
  @JoinColumn({ name: 'generated_by' })
  generatedBy: User;

  @CreateDateColumn()
  created_at: Date;
}
