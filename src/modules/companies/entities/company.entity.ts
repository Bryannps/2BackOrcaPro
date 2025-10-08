/**
 * Entidade Company - Representa as empresas no sistema
 * Uma empresa pode ter múltiplos templates e orçamentos
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BudgetTemplate } from '../../templates/entities/budget-template.entity';
import { Budget } from '../../budgets/entities/budget.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column({ length: 255, unique: true, nullable: false })
  email: string;

  @Column({ length: 20, nullable: true })
  document: string;

  @Column('jsonb', { default: {} })
  settings: Record<string, any>;

  // Relacionamentos
  @OneToMany(() => BudgetTemplate, template => template.company)
  templates: BudgetTemplate[];

  @OneToMany(() => Budget, budget => budget.company)
  budgets: Budget[];

  // Timestamps
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}