import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from './Project';

@Entity({ name: 'user', schema: 'neon_auth', synchronize: false })
export class User {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ name: 'emailVerified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'text', nullable: true })
  image?: string;

  @Column({ type: 'text', nullable: true })
  role?: string;

  @Column({ type: 'boolean', default: false })
  banned: boolean;

  @Column({ name: 'banReason', type: 'text', nullable: true })
  banReason?: string;

  @Column({ name: 'banExpires', type: 'timestamptz', nullable: true })
  banExpires?: Date;

  @OneToMany(() => Project, (project) => project.user)
  projects: Project[];

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamptz' })
  updatedAt: Date;
}
