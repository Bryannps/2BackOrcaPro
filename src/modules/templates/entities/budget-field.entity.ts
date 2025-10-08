/**
 * Entidade BudgetField - Campos dinâmicos dos templates
 * Define os tipos de campos que podem ser preenchidos nos orçamentos
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BudgetCategory } from './budget-category.entity';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean' | 'calculated';

export interface FieldCalculation {
  is_calculated: boolean;
  formula: string;
  depends_on: string[];
}

@Entity('budget_fields')
export class BudgetField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  label: string;

  @Column({
    type: 'enum',
    enum: ['text', 'number', 'select', 'date', 'boolean', 'calculated'],
    default: 'text'
  })
  type: FieldType;

  @Column({ default: false })
  required: boolean;

  @Column('jsonb', { nullable: true })
  options: any; // Para campos select, configurações específicas

  @Column('text', { nullable: true })
  validation: string; // Regras de validação

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column('jsonb', { default: { is_calculated: false, formula: '', depends_on: [] } })
  calculation: FieldCalculation;

  // Relacionamentos
  @ManyToOne(() => BudgetCategory, category => category.fields)
  @JoinColumn({ name: 'category_id' })
  category: BudgetCategory;

  @Column('uuid')
  category_id: string;
}