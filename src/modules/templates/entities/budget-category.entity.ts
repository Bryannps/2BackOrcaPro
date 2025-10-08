/**
 * Entidade BudgetCategory - Categorias dos templates de orçamento
 * Agrupa campos relacionados dentro de um template
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BudgetTemplate } from './budget-template.entity';
import { BudgetField } from './budget-field.entity';
import { BudgetItem } from '../../budgets/entities/budget-item.entity';

@Entity('budget_categories')
export class BudgetCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ default: false })
  is_repeatable: boolean;

  @Column('jsonb', { default: {} })
  validation_rules: Record<string, any>;

  // Relacionamentos
  @ManyToOne(() => BudgetTemplate, template => template.categories)
  @JoinColumn({ name: 'template_id' })
  template: BudgetTemplate;

  @Column('uuid')
  template_id: string;

  @OneToMany(() => BudgetField, field => field.category, { cascade: true })
  fields: BudgetField[];

  @OneToMany(() => BudgetItem, item => item.category)
  items: BudgetItem[];
}