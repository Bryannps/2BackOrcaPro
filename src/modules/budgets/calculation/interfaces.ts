/**
 * Interfaces e tipos para o sistema de cálculos
 * Define contratos para as estratégias de cálculo
 */

import { BudgetTemplate } from '../../templates/entities/budget-template.entity';
import { BudgetItemDto } from '../dto/budget.dto';

export interface CalculationContext {
  company_id: string;
  currency: string;
  tax_rates: Record<string, number>;
  custom_rates?: Record<string, number>;
  settings?: Record<string, any>;
}

export interface CalculatedItem {
  category_id: string;
  field_values: Record<string, any>;
  amount: number;
  order: number;
  calculations?: Record<string, any>; // Valores intermediários
}

export interface CalculationResult {
  items: CalculatedItem[];
  total: number;
  subtotals: Record<string, number>;
  metadata: {
    base_total: number;
    taxes: number;
    discounts?: number;
    category_breakdown: Record<string, number>;
    strategy_used: string;
    calculation_date: string;
    [key: string]: any; // Permite propriedades adicionais específicas da estratégia
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ICalculationStrategy {
  readonly type: string;
  
  calculate(
    template: BudgetTemplate,
    items: BudgetItemDto[],
    context: CalculationContext,
  ): Promise<CalculationResult>;

  validate(
    template: BudgetTemplate,
    items: BudgetItemDto[],
  ): Promise<ValidationResult>;
}