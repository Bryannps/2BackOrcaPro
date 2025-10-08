/**
 * Estratégia de Cálculo Padrão
 * Implementa cálculos básicos para orçamentos simples
 */

import { Injectable } from '@nestjs/common';
import { BudgetTemplate } from '../../../templates/entities/budget-template.entity';
import { BudgetItemDto } from '../../dto/budget.dto';
import {
  ICalculationStrategy,
  CalculationContext,
  CalculationResult,
  CalculatedItem,
  ValidationResult,
} from '../interfaces';

@Injectable()
export class DefaultCalculationStrategy implements ICalculationStrategy {
  readonly type = 'default';

  /**
   * Executa cálculo básico
   */
  async calculate(
    template: BudgetTemplate,
    items: BudgetItemDto[],
    context: CalculationContext,
  ): Promise<CalculationResult> {
    const calculatedItems: CalculatedItem[] = [];
    const categoryTotals: Map<string, number> = new Map();
    let grandTotal = 0;

    for (const item of items) {
      const category = template.categories.find(c => c.id === item.category_id);
      if (!category) continue;

      const calculatedItem = await this.calculateItem(category, item, context);
      calculatedItems.push(calculatedItem);

      // Acumular totais por categoria
      const categoryTotal = categoryTotals.get(category.id) || 0;
      categoryTotals.set(category.id, categoryTotal + calculatedItem.amount);
      
      grandTotal += calculatedItem.amount;
    }

    // Aplicar impostos se configurado
    const taxRate = context.tax_rates?.default || 0;
    const taxes = grandTotal * taxRate;
    const finalTotal = grandTotal + taxes;

    return {
      items: calculatedItems,
      total: finalTotal,
      subtotals: this.calculateSubtotals(categoryTotals, template),
      metadata: {
        base_total: grandTotal,
        taxes: taxes,
        category_breakdown: Object.fromEntries(categoryTotals),
        strategy_used: this.type,
        calculation_date: new Date().toISOString(),
      },
    };
  }

  /**
   * Calcula um item individual
   */
  private async calculateItem(
    category: any,
    item: BudgetItemDto,
    context: CalculationContext,
  ): Promise<CalculatedItem> {
    let itemAmount = 0;
    const calculations: Record<string, any> = {};

    // Calcular campos calculados
    for (const field of category.fields) {
      const fieldData = item.field_values[field.label];
      
      if (!fieldData) continue;
      
      if (field.type === 'calculated' && field.calculation?.is_calculated) {
        const calculatedValue = this.executeFieldCalculation(
          field,
          item.field_values,
          calculations,
        );
        calculations[field.label] = calculatedValue;
        itemAmount += calculatedValue || 0;
      } else if (typeof fieldData === 'object' && fieldData.value !== undefined && fieldData.unit_cost !== undefined) {
        // Calcular: quantidade * custo unitário
        const value = Number(fieldData.value) || 0;
        const unitCost = Number(fieldData.unit_cost) || 0;
        const fieldTotal = value * unitCost;
        
        calculations[field.label] = {
          value,
          unit_cost: unitCost,
          total: fieldTotal
        };
        itemAmount += fieldTotal;
      } else if (field.type === 'number' && !isNaN(Number(fieldData))) {
        // Valores numéricos diretos
        const numericValue = Number(fieldData) || 0;
        calculations[field.label] = numericValue;
        itemAmount += numericValue;
      } else if (fieldData && !isNaN(Number(fieldData))) {
        // Tentar converter campos de texto que contêm números
        const numericValue = Number(fieldData) || 0;
        calculations[field.label] = numericValue;
        itemAmount += numericValue;
      }
    }

    return {
      category_id: item.category_id,
      field_values: item.field_values,
      amount: itemAmount,
      order: item.order,
      calculations,
    };
  }

  /**
   * Executa cálculo de campo calculado
   */
  private executeFieldCalculation(
    field: any,
    fieldValues: Record<string, any>,
    calculations: Record<string, any>,
  ): number {
    try {
      const formula = field.calculation.formula;
      let expression = formula;

      // Substituir variáveis na fórmula
      for (const dependency of field.calculation.depends_on) {
        const value = fieldValues[dependency] || calculations[dependency] || 0;
        const numericValue = Number(value) || 0;
        
        // Substituir por nome de campo (convertido para snake_case)
        const fieldName = dependency.toLowerCase().replace(/\s+/g, '_');
        expression = expression.replace(
          new RegExp(fieldName, 'g'),
          numericValue.toString(),
        );
      }

      // Avaliar expressão matemática básica
      return this.evaluateExpression(expression);
    } catch (error) {
      console.warn(`Erro ao calcular campo ${field.label}:`, error);
      return 0;
    }
  }

  /**
   * Avalia expressão matemática simples
   */
  private evaluateExpression(expression: string): number {
    try {
      // Limpar expressão - apenas números, operadores básicos e parênteses
      const cleanExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
      
      // Usar Function para avaliar (cuidado com segurança em produção)
      // Em produção, usar biblioteca como math.js
      return Function(`"use strict"; return (${cleanExpression})`)();
    } catch (error) {
      console.warn('Erro ao avaliar expressão:', expression, error);
      return 0;
    }
  }

  /**
   * Calcula subtotais por categoria
   */
  private calculateSubtotals(
    categoryTotals: Map<string, number>,
    template: BudgetTemplate,
  ): Record<string, number> {
    const subtotals: Record<string, number> = {};
    
    for (const category of template.categories) {
      subtotals[category.name] = categoryTotals.get(category.id) || 0;
    }
    
    return subtotals;
  }

  /**
   * Valida dados do orçamento
   */
  async validate(
    template: BudgetTemplate,
    items: BudgetItemDto[],
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar se todas as categorias obrigatórias estão presentes
    for (const category of template.categories) {
      const categoryItems = items.filter(item => item.category_id === category.id);
      
      if (!category.is_repeatable && categoryItems.length === 0) {
        warnings.push(`Categoria "${category.name}" não possui itens`);
      }

      // Validar campos obrigatórios em cada item
      for (const item of categoryItems) {
        for (const field of category.fields) {
          if (field.required && !item.field_values[field.id]) {
            errors.push(
              `Campo obrigatório "${field.label}" não preenchido na categoria "${category.name}"`,
            );
          }

          // Validar tipos de dados
          if (field.type === 'number' && item.field_values[field.id]) {
            const value = item.field_values[field.id];
            if (isNaN(Number(value))) {
              errors.push(
                `Campo "${field.label}" deve ser um número válido`,
              );
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}