/**
 * Estratégia de Cálculo para Serviços
 * Implementa cálculos específicos para prestação de serviços
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
export class ServiceCalculationStrategy implements ICalculationStrategy {
  readonly type = 'service';

  /**
   * Executa cálculo para serviços
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

      const calculatedItem = await this.calculateServiceItem(
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

    // Aplicar desconto se configurado
    const discount = this.calculateDiscount(grandTotal, context);
    const discountedTotal = grandTotal - discount;

    // Aplicar ISS (específico para serviços)
    const issAmount = this.calculateISS(discountedTotal, context);
    
    // Aplicar margem de lucro
    const finalTotal = this.applyServiceProfitMargin(discountedTotal + issAmount, context);

    return {
      items: calculatedItems,
      total: finalTotal,
      subtotals: this.calculateServiceSubtotals(categoryTotals, template),
      metadata: {
        base_total: grandTotal,
        taxes: issAmount,
        discounts: discount,
        category_breakdown: Object.fromEntries(categoryTotals),
        strategy_used: this.type,
        calculation_date: new Date().toISOString(),
        service_details: {
          iss_rate: context.tax_rates?.iss || 0.05,
          profit_margin: context.settings?.profit_margin || 0.30,
          discount_applied: discount,
        },
      },
    };
  }

  /**
   * Calcula item de serviço
   */
  private async calculateServiceItem(
    category: any,
    item: BudgetItemDto,
    context: CalculationContext,
  ): Promise<CalculatedItem> {
    let baseAmount = 0;
    const calculations: Record<string, any> = {};

    // Calcular valores base
    for (const field of category.fields) {
      if (field.type === 'calculated' && field.calculation?.is_calculated) {
        const calculatedValue = this.executeServiceCalculation(
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

    // Aplicar fator de dificuldade se for categoria de serviços especializados
    const difficultyFactor = this.getDifficultyFactor(category.name, item.field_values);
    const adjustedAmount = baseAmount * difficultyFactor;

    return {
      category_id: item.category_id,
      field_values: item.field_values,
      amount: adjustedAmount,
      order: item.order,
      calculations: {
        ...calculations,
        base_amount: baseAmount,
        difficulty_factor: difficultyFactor,
        adjusted_amount: adjustedAmount,
      },
    };
  }

  /**
   * Executa cálculos específicos de serviços
   */
  private executeServiceCalculation(
    field: any,
    fieldValues: Record<string, any>,
    calculations: Record<string, any>,
    context: CalculationContext,
  ): number {
    try {
      const formula = field.calculation.formula;
      
      // Fórmulas específicas para serviços
      if (formula.includes('horas_consultoria')) {
        return this.calculateConsultingHours(fieldValues, context);
      }
      
      if (formula.includes('custo_servico_fixo')) {
        return this.calculateFixedServiceCost(fieldValues, context);
      }
      
      if (formula.includes('custo_por_resultado')) {
        return this.calculateResultBasedCost(fieldValues, context);
      }

      // Cálculo padrão
      return this.evaluateServiceExpression(formula, fieldValues, calculations);
    } catch (error) {
      console.warn(`Erro ao calcular campo de serviço ${field.label}:`, error);
      return 0;
    }
  }

  /**
   * Calcula horas de consultoria
   */
  private calculateConsultingHours(
    fieldValues: Record<string, any>,
    context: CalculationContext,
  ): number {
    const hours = Number(fieldValues['quantidade_horas'] || fieldValues['horas']) || 0;
    const hourlyRate = Number(fieldValues['valor_por_hora'] || fieldValues['taxa_horaria']) || 0;
    
    // Aplicar fator de experiência do profissional
    const experienceFactor = this.getExperienceFactor(fieldValues);
    
    return hours * hourlyRate * experienceFactor;
  }

  /**
   * Calcula custo de serviço fixo
   */
  private calculateFixedServiceCost(
    fieldValues: Record<string, any>,
    context: CalculationContext,
  ): number {
    const basePrice = Number(fieldValues['valor_base']) || 0;
    const complexity = fieldValues['complexidade'] || 'normal';
    
    // Aplicar multiplicador por complexidade
    const complexityMultipliers: Record<string, number> = {
      'simples': 0.8,
      'normal': 1.0,
      'complexo': 1.5,
      'muito_complexo': 2.0,
    };
    
    return basePrice * (complexityMultipliers[complexity] || 1.0);
  }

  /**
   * Calcula custo baseado em resultados
   */
  private calculateResultBasedCost(
    fieldValues: Record<string, any>,
    context: CalculationContext,
  ): number {
    const baseValue = Number(fieldValues['valor_base']) || 0;
    const expectedResults = Number(fieldValues['resultados_esperados']) || 1;
    const performanceBonus = Number(fieldValues['bonus_performance']) || 0;
    
    return baseValue * expectedResults + performanceBonus;
  }

  /**
   * Obtém fator de experiência
   */
  private getExperienceFactor(fieldValues: Record<string, any>): number {
    const experience = fieldValues['nivel_experiencia'] || 'pleno';
    
    const experienceFactors: Record<string, number> = {
      'junior': 0.8,
      'pleno': 1.0,
      'senior': 1.3,
      'especialista': 1.6,
    };
    
    return experienceFactors[experience] || 1.0;
  }

  /**
   * Obtém fator de dificuldade
   */
  private getDifficultyFactor(categoryName: string, fieldValues: Record<string, any>): number {
    // Fatores base por categoria
    const categoryFactors: Record<string, number> = {
      'Consultoria': 1.2,
      'Desenvolvimento': 1.1,
      'Suporte': 1.0,
      'Treinamento': 1.15,
      'Manutenção': 0.9,
    };
    
    let baseFactor = categoryFactors[categoryName] || 1.0;
    
    // Ajustar baseado na urgência
    const urgency = fieldValues['urgencia'] || 'normal';
    const urgencyFactors: Record<string, number> = {
      'baixa': 0.95,
      'normal': 1.0,
      'alta': 1.2,
      'critica': 1.5,
    };
    
    return baseFactor * (urgencyFactors[urgency] || 1.0);
  }

  /**
   * Calcula desconto baseado no volume
   */
  private calculateDiscount(amount: number, context: CalculationContext): number {
    const discountRules = context.settings?.discount_rules || [];
    
    for (const rule of discountRules) {
      if (amount >= rule.min_amount) {
        return amount * (rule.discount_rate || 0);
      }
    }
    
    return 0;
  }

  /**
   * Calcula ISS (Imposto Sobre Serviços)
   */
  private calculateISS(amount: number, context: CalculationContext): number {
    const issRate = context.tax_rates?.iss || 0.05; // 5% padrão
    return amount * issRate;
  }

  /**
   * Aplica margem de lucro específica para serviços
   */
  private applyServiceProfitMargin(amount: number, context: CalculationContext): number {
    const profitMargin = context.settings?.profit_margin || 0.30; // 30% padrão
    return amount * (1 + profitMargin);
  }

  /**
   * Calcula subtotais específicos para serviços
   */
  private calculateServiceSubtotals(
    categoryTotals: Map<string, number>,
    template: BudgetTemplate,
  ): Record<string, number> {
    const subtotals: Record<string, number> = {};
    
    for (const category of template.categories) {
      const baseTotal = categoryTotals.get(category.id) || 0;
      subtotals[category.name] = baseTotal;
      
      // Adicionar breakdown por tipo de serviço
      if (category.name === 'Recursos Humanos') {
        subtotals[`${category.name} (Consultoria)`] = baseTotal * 0.7;
        subtotals[`${category.name} (Execução)`] = baseTotal * 0.3;
      }
    }
    
    return subtotals;
  }

  /**
   * Avalia expressão específica para serviços
   */
  private evaluateServiceExpression(
    expression: string,
    fieldValues: Record<string, any>,
    calculations: Record<string, any>,
  ): number {
    try {
      let expr = expression;
      
      // Substituir variáveis específicas de serviços
      Object.keys(fieldValues).forEach(key => {
        const value = Number(fieldValues[key]) || 0;
        expr = expr.replace(new RegExp(key, 'g'), value.toString());
      });
      
      return Function(`"use strict"; return (${expr})`)();
    } catch (error) {
      return 0;
    }
  }

  /**
   * Validação específica para serviços
   */
  async validate(
    template: BudgetTemplate,
    items: BudgetItemDto[],
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const category of template.categories) {
      const categoryItems = items.filter(item => item.category_id === category.id);
      
      for (const item of categoryItems) {
        for (const field of category.fields) {
          if (field.required && !item.field_values[field.id]) {
            errors.push(
              `Campo obrigatório "${field.label}" não preenchido na categoria "${category.name}"`,
            );
          }
          
          // Validações específicas para serviços
          if (field.type === 'number') {
            const value = Number(item.field_values[field.id]);
            
            // Validar valores de hora
            if (field.label.includes('valor_por_hora') && (value < 20 || value > 1000)) {
              warnings.push(
                `Valor por hora (${value}) parece fora do padrão em "${field.label}". Verificar se está correto.`,
              );
            }
            
            // Validar quantidade de horas
            if (field.label.includes('horas') && value > 500) {
              warnings.push(
                `Quantidade de horas muito alta (${value}) em "${field.label}". Verificar se está correto.`,
              );
            }
          }
          
          // Validar campos de seleção específicos
          if (field.type === 'select') {
            const value = item.field_values[field.id];
            
            if (field.label.includes('complexidade') && !['simples', 'normal', 'complexo', 'muito_complexo'].includes(value)) {
              errors.push(
                `Valor inválido para complexidade: "${value}". Deve ser: simples, normal, complexo ou muito_complexo.`,
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