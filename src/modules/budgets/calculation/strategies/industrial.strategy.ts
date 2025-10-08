/**
 * Estratégia de Cálculo Industrial
 * Implementa cálculos específicos para projetos industriais
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
export class IndustrialCalculationStrategy implements ICalculationStrategy {
  readonly type = 'industrial';

  /**
   * Executa cálculo industrial com fatores específicos
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

      const calculatedItem = await this.calculateIndustrialItem(
        category,
        item,
        context,
      );
      
      calculatedItems.push(calculatedItem);

      // Acumular totais por categoria
      const categoryTotal = categoryTotals.get(category.id) || 0;
      categoryTotals.set(category.id, categoryTotal + calculatedItem.amount);
      
      grandTotal += calculatedItem.amount;
    }

    // Aplicar fatores industriais
    const factorizedTotal = this.applyIndustrialFactors(grandTotal, context);
    
    // Aplicar impostos industriais
    const taxedTotal = this.applyIndustrialTaxes(factorizedTotal, context);
    
    // Aplicar margem de lucro
    const finalTotal = this.applyProfitMargin(taxedTotal, context);

    return {
      items: calculatedItems,
      total: finalTotal,
      subtotals: this.calculateIndustrialSubtotals(categoryTotals, template),
      metadata: {
        base_total: grandTotal,
        taxes: finalTotal - grandTotal,
        category_breakdown: Object.fromEntries(categoryTotals),
        strategy_used: this.type,
        calculation_date: new Date().toISOString(),
        industrial_factors: {
          complexity_factor: context.settings?.complexity_factor || 1.0,
          risk_factor: context.settings?.risk_factor || 1.1,
          equipment_factor: context.settings?.equipment_factor || 1.05,
        },
      },
    };
  }

  /**
   * Calcula item com fatores industriais
   */
  private async calculateIndustrialItem(
    category: any,
    item: BudgetItemDto,
    context: CalculationContext,
  ): Promise<CalculatedItem> {
    let baseAmount = 0;
    const calculations: Record<string, any> = {};

    // Calcular valores base
    for (const field of category.fields) {
      if (field.type === 'calculated' && field.calculation?.is_calculated) {
        const calculatedValue = this.executeIndustrialCalculation(
          field,
          item.field_values,
          calculations,
          context,
        );
        calculations[field.label] = calculatedValue;
        baseAmount += calculatedValue || 0;
      } else if (field.type === 'number' && item.field_values[field.id]) {
        const numericValue = Number(item.field_values[field.id]) || 0;
        calculations[field.label] = numericValue;
        baseAmount += numericValue;
      }
    }

    // Aplicar fatores específicos da categoria
    const categoryFactor = this.getCategoryFactor(category.name);
    const adjustedAmount = baseAmount * categoryFactor;

    return {
      category_id: item.category_id,
      field_values: item.field_values,
      amount: adjustedAmount,
      order: item.order,
      calculations: {
        ...calculations,
        base_amount: baseAmount,
        category_factor: categoryFactor,
        adjusted_amount: adjustedAmount,
      },
    };
  }

  /**
   * Executa cálculos específicos industriais
   */
  private executeIndustrialCalculation(
    field: any,
    fieldValues: Record<string, any>,
    calculations: Record<string, any>,
    context: CalculationContext,
  ): number {
    try {
      const formula = field.calculation.formula;
      
      // Fórmulas específicas industriais
      if (formula.includes('horas_trabalho')) {
        return this.calculateWorkHours(fieldValues, context);
      }
      
      if (formula.includes('custo_material')) {
        return this.calculateMaterialCost(fieldValues, context);
      }
      
      if (formula.includes('custo_equipamento')) {
        return this.calculateEquipmentCost(fieldValues, context);
      }

      // Cálculo padrão
      return this.evaluateExpression(formula, fieldValues, calculations);
    } catch (error) {
      console.warn(`Erro ao calcular campo industrial ${field.label}:`, error);
      return 0;
    }
  }

  /**
   * Calcula custo de horas de trabalho
   */
  private calculateWorkHours(
    fieldValues: Record<string, any>,
    context: CalculationContext,
  ): number {
    const hours = Number(fieldValues['quantidade_horas'] || fieldValues['horas']) || 0;
    const hourlyRate = Number(fieldValues['valor_por_hora'] || fieldValues['taxa_horaria']) || 0;
    
    // Aplicar fator de complexidade
    const complexityFactor = context.settings?.complexity_factor || 1.0;
    
    return hours * hourlyRate * complexityFactor;
  }

  /**
   * Calcula custo de materiais
   */
  private calculateMaterialCost(
    fieldValues: Record<string, any>,
    context: CalculationContext,
  ): number {
    const quantity = Number(fieldValues['quantidade']) || 0;
    const unitPrice = Number(fieldValues['valor_unitario'] || fieldValues['preco_unitario']) || 0;
    
    // Aplicar fator de desperdício
    const wasteFactor = context.settings?.material_waste_factor || 1.1;
    
    return quantity * unitPrice * wasteFactor;
  }

  /**
   * Calcula custo de equipamentos
   */
  private calculateEquipmentCost(
    fieldValues: Record<string, any>,
    context: CalculationContext,
  ): number {
    const hours = Number(fieldValues['horas_equipamento']) || 0;
    const hourlyRate = Number(fieldValues['custo_por_hora_equipamento']) || 0;
    
    // Aplicar fator de depreciação
    const depreciationFactor = context.settings?.equipment_depreciation_factor || 1.05;
    
    return hours * hourlyRate * depreciationFactor;
  }

  /**
   * Aplica fatores industriais
   */
  private applyIndustrialFactors(
    amount: number,
    context: CalculationContext,
  ): number {
    const riskFactor = context.settings?.risk_factor || 1.1;
    const complexityFactor = context.settings?.complexity_factor || 1.0;
    
    return amount * riskFactor * complexityFactor;
  }

  /**
   * Aplica impostos industriais
   */
  private applyIndustrialTaxes(
    amount: number,
    context: CalculationContext,
  ): number {
    const icmsRate = context.tax_rates?.icms || 0.18;
    const ipiRate = context.tax_rates?.ipi || 0.05;
    const pisCofinRate = context.tax_rates?.pis_cofins || 0.038;
    
    const icms = amount * icmsRate;
    const ipi = amount * ipiRate;
    const pisCofins = amount * pisCofinRate;
    
    return amount + icms + ipi + pisCofins;
  }

  /**
   * Aplica margem de lucro
   */
  private applyProfitMargin(
    amount: number,
    context: CalculationContext,
  ): number {
    const profitMargin = context.settings?.profit_margin || 0.30;
    return amount * (1 + profitMargin);
  }

  /**
   * Obtém fator específico da categoria
   */
  private getCategoryFactor(categoryName: string): number {
    const factors: Record<string, number> = {
      'Recursos Humanos': 1.0,
      'Materiais': 1.1, // 10% de desperdício
      'Equipamentos': 1.05, // 5% de depreciação
      'Subcontratação': 1.15, // 15% de overhead
      'Logística': 1.2, // 20% de complexidade
    };
    
    return factors[categoryName] || 1.0;
  }

  /**
   * Calcula subtotais industriais
   */
  private calculateIndustrialSubtotals(
    categoryTotals: Map<string, number>,
    template: BudgetTemplate,
  ): Record<string, number> {
    const subtotals: Record<string, number> = {};
    
    for (const category of template.categories) {
      const baseTotal = categoryTotals.get(category.id) || 0;
      const factor = this.getCategoryFactor(category.name);
      subtotals[category.name] = baseTotal * factor;
    }
    
    return subtotals;
  }

  /**
   * Avalia expressão com contexto industrial
   */
  private evaluateExpression(
    expression: string,
    fieldValues: Record<string, any>,
    calculations: Record<string, any>,
  ): number {
    try {
      let expr = expression;
      
      // Substituir variáveis
      Object.keys(fieldValues).forEach(key => {
        const value = Number(fieldValues[key]) || 0;
        expr = expr.replace(new RegExp(key, 'g'), value.toString());
      });
      
      Object.keys(calculations).forEach(key => {
        const value = Number(calculations[key]) || 0;
        expr = expr.replace(new RegExp(key, 'g'), value.toString());
      });
      
      return Function(`"use strict"; return (${expr})`)();
    } catch (error) {
      return 0;
    }
  }

  /**
   * Validação específica industrial
   */
  async validate(
    template: BudgetTemplate,
    items: BudgetItemDto[],
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações básicas
    for (const category of template.categories) {
      const categoryItems = items.filter(item => item.category_id === category.id);
      
      for (const item of categoryItems) {
        for (const field of category.fields) {
          if (field.required && !item.field_values[field.id]) {
            errors.push(
              `Campo obrigatório "${field.label}" não preenchido na categoria "${category.name}"`,
            );
          }
          
          // Validações específicas industriais
          if (field.type === 'number') {
            const value = Number(item.field_values[field.id]);
            
            if (field.label.includes('horas') && value > 2000) {
              warnings.push(
                `Quantidade de horas muito alta (${value}) em "${field.label}". Verificar se está correto.`,
              );
            }
            
            if (field.label.includes('valor') && value > 1000000) {
              warnings.push(
                `Valor muito alto (${value}) em "${field.label}". Verificar se está correto.`,
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