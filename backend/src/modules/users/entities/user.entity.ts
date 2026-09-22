import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Survey } from '../../surveys/entities/survey.entity';
import { Report } from '../../reports/entities/report.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ default: 'USER' })
  role: string;

  @Column({ default: false })
  deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Survey, (survey: Survey) => survey.createdBy as User)
  surveys: Survey[];

  @OneToMany(() => Report, (report: Report) => report.generatedBy as User)
  reports: Report[];
}
