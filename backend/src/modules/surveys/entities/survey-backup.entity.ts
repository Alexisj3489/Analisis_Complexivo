import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Survey } from './survey.entity';

@Entity('survey_backups')
export class SurveyBackup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ type: 'jsonb' })
  snapshot: any;

  @CreateDateColumn()
  created_at: Date;
}
