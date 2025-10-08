/**
 * Entidade BudgetItem - Itens/linhas dos orçamentos
 * Representa os valores preenchidos para cada categoria do template
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Budget } from './budget.entity';
import { BudgetCategory } from '../../templates/entities/budget-category.entity';

@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { nullable: false })
  field_values: Record<string, any>; // Valores dos campos preenchidos

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  amount: number; // Valor calculado do item

  @Column({ type: 'int', default: 0 })
  order: number;

  // Relacionamentos
  @ManyToOne(() => Budget, budget => budget.items)
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column('uuid')
  budget_id: string;

  @ManyToOne(() => BudgetCategory, category => category.items)
  @JoinColumn({ name: 'category_id' })
  category: BudgetCategory;

  @Column('uuid')
  category_id: string;
}