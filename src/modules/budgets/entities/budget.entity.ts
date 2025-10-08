/**
 * Entidade Budget - Orçamentos criados baseados em templates
 * Representa um orçamento específico de uma empresa
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { BudgetTemplate } from '../../templates/entities/budget-template.entity';
import { BudgetItem } from './budget-item.entity';

export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'sent', 'approved', 'rejected'],
    default: 'draft'
  })
  status: BudgetStatus;

  @Column('jsonb', { default: {} })
  custom_data: Record<string, any>;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  // Relacionamentos
  @ManyToOne(() => Company, company => company.budgets)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid')
  company_id: string;

  @ManyToOne(() => BudgetTemplate, template => template.budgets)
  @JoinColumn({ name: 'template_id' })
  template: BudgetTemplate;

  @Column('uuid')
  template_id: string;

  @OneToMany(() => BudgetItem, item => item.budget, { cascade: true })
  items: BudgetItem[];

  // Timestamps
  @CreateDateColumn()
  created_at: Date;
}