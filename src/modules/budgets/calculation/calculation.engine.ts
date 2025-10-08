/**
 * Motor de Cálculos Principal
 * Gerencia e executa diferentes estratégias de cálculo
 */

import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BudgetTemplate } from '../../templates/entities/budget-template.entity';
import { Company } from '../../companies/entities/company.entity';
import { BudgetItemDto } from '../dto/budget.dto';
import {
  ICalculationStrategy,
  CalculationContext,
  CalculationResult,
} from './interfaces';

import { DefaultCalculationStrategy } from './strategies/default.strategy';
import { IndustrialCalculationStrategy } from './strategies/industrial.strategy';
import { ServiceCalculationStrategy } from './strategies/service.strategy';

@Injectable()
export class CalculationEngine {
  private strategies: Map<string, ICalculationStrategy> = new Map();

  constructor(
    private configService: ConfigService,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @Inject(forwardRef(() => DefaultCalculationStrategy))
    private defaultStrategy: DefaultCalculationStrategy,
    @Inject(forwardRef(() => IndustrialCalculationStrategy))
    private industrialStrategy: IndustrialCalculationStrategy,
    @Inject(forwardRef(() => ServiceCalculationStrategy))
    private serviceStrategy: ServiceCalculationStrategy,
  ) {
    this.registerStrategies();
  }

  /**
   * Registra todas as estratégias de cálculo
   */
  private registerStrategies() {
    this.strategies.set('default', this.defaultStrategy);
    this.strategies.set('industrial', this.industrialStrategy);
    this.strategies.set('service', this.serviceStrategy);
  }

  /**
   * Executa cálculo do orçamento
   */
  async calculate(
    template: BudgetTemplate,
    items: BudgetItemDto[],
    companyId: string,
  ): Promise<CalculationResult> {
    // Determinar estratégia baseada no template
    const strategyType = this.determineStrategy(template);
    const strategy = this.strategies.get(strategyType) || this.defaultStrategy;

    // Criar contexto de cálculo
    const context = await this.createCalculationContext(companyId, template);

    // Validar antes de calcular
    const validation = await strategy.validate(template, items);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Erro de validação nos dados do orçamento',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Executar cálculo
    return strategy.calculate(template, items, context);
  }

  /**
   * Determina qual estratégia usar baseada no template
   */
  private determineStrategy(template: BudgetTemplate): string {
    // Prioridade: strategy explícita no template > padrão
    return template.calculation_rules?.strategy || 'default';
  }

  /**
   * Cria contexto de cálculo com dados da empresa
   */
  private async createCalculationContext(
    companyId: string,
    template: BudgetTemplate,
  ): Promise<CalculationContext> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new BadRequestException('Empresa não encontrada');
    }

    return {
      company_id: companyId,
      currency: company.settings?.currency || 'BRL',
      tax_rates: {
        default: company.settings?.tax_rate || 0.18,
        iss: company.settings?.iss_rate || 0.05,
        pis_cofins: company.settings?.pis_cofins_rate || 0.038,
      },
      custom_rates: company.settings?.custom_rates || {},
      settings: company.settings || {},
    };
  }

  /**
   * Registra uma nova estratégia
   */
  registerStrategy(type: string, strategy: ICalculationStrategy) {
    this.strategies.set(type, strategy);
  }

  /**
   * Lista estratégias disponíveis
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Valida dados do orçamento sem calcular
   */
  async validate(
    template: BudgetTemplate,
    items: BudgetItemDto[],
  ): Promise<any> {
    const strategyType = this.determineStrategy(template);
    const strategy = this.strategies.get(strategyType) || this.defaultStrategy;
    
    return strategy.validate(template, items);
  }
}