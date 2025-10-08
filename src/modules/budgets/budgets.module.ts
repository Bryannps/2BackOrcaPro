/**
 * Módulo de Budgets (Orçamentos)
 * Gerencia orçamentos criados baseados em templates
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './entities/budget.entity';
import { BudgetItem } from './entities/budget-item.entity';
import { BudgetTemplate } from '../templates/entities/budget-template.entity';
import { BudgetCategory } from '../templates/entities/budget-category.entity';
import { BudgetField } from '../templates/entities/budget-field.entity';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { CalculationEngine } from './calculation/calculation.engine';
import { DefaultCalculationStrategy } from './calculation/strategies/default.strategy';
import { IndustrialCalculationStrategy } from './calculation/strategies/industrial.strategy';
import { ServiceCalculationStrategy } from './calculation/strategies/service.strategy';
import { CompaniesModule } from '../companies/companies.module';
import { Company } from '../companies/entities/company.entity';
import { PdfService } from '../../shared/services/pdf.service';
import { EmailService } from '../../shared/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Budget,
      BudgetItem,
      BudgetTemplate,
      BudgetCategory,
      BudgetField,
      Company,
    ]),
    CompaniesModule,
  ],
  controllers: [BudgetsController],
  providers: [
    BudgetsService,
    CalculationEngine,
    DefaultCalculationStrategy,
    IndustrialCalculationStrategy,
    ServiceCalculationStrategy,
    PdfService,
    EmailService,
  ],
  exports: [BudgetsService, CalculationEngine],
})
export class BudgetsModule {}