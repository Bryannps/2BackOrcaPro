/**
 * Entidade BudgetTemplate - Template base para criação de orçamentos
 * Define a estrutura e regras de cálculo para os orçamentos
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
import { BudgetCategory } from './budget-category.entity';
import { Budget } from '../../budgets/entities/budget.entity';

export interface CalculationRules {
  formula: string;
  variables: string[];
  conditions: any[];
  strategy?: string; // 'default' | 'industrial' | 'service'
}

@Entity('budget_templates')
export class BudgetTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column('jsonb', { default: { formula: '', variables: [], conditions: [] } })
  calculation_rules: CalculationRules;

  // Relacionamentos
  @ManyToOne(() => Company, company => company.templates)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid')
  company_id: string;

  @OneToMany(() => BudgetCategory, category => category.template, { cascade: true })
  categories: BudgetCategory[];

  @OneToMany(() => Budget, budget => budget.template)
  budgets: Budget[];

  // Timestamps
  @CreateDateColumn()
  created_at: Date;
}