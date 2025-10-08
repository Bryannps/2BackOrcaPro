/**
 * Módulo de Templates
 * Gerencia templates de orçamento e suas categorias/campos
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetTemplate } from './entities/budget-template.entity';
import { BudgetCategory } from './entities/budget-category.entity';
import { BudgetField } from './entities/budget-field.entity';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BudgetTemplate,
      BudgetCategory,
      BudgetField,
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}