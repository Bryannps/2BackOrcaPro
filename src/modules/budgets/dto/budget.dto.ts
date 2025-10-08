/**
 * DTOs para Budgets (Orçamentos)
 * Define estruturas de dados para CRUD de orçamentos
 */

import {
  IsString,
  IsObject,
  IsArray,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BudgetStatus } from '../entities/budget.entity';

export class BudgetItemDto {
  @IsUUID(4, { message: 'category_id deve ser um UUID válido' })
  category_id: string;

  @IsObject({ message: 'field_values deve ser um objeto' })
  field_values: Record<string, any>;

  @IsNumber({}, { message: 'order deve ser um número' })
  @Min(0, { message: 'order deve ser maior ou igual a 0' })
  order: number;
}

export class CreateBudgetDto {
  @IsUUID(4, { message: 'template_id deve ser um UUID válido' })
  template_id: string;

  @IsString({ message: 'título é obrigatório' })
  @MinLength(3, { message: 'título deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'título não pode exceder 255 caracteres' })
  title: string;

  @IsArray({ message: 'items deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items: BudgetItemDto[];
}

export class UpdateBudgetDto {
  @IsOptional()
  @IsString({ message: 'título deve ser uma string' })
  @MinLength(3, { message: 'título deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'título não pode exceder 255 caracteres' })
  title?: string;

  @IsOptional()
  @IsEnum(['draft', 'sent', 'approved', 'rejected'], {
    message: 'status deve ser: draft, sent, approved ou rejected',
  })
  status?: BudgetStatus;

  @IsOptional()
  @IsArray({ message: 'items deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items?: BudgetItemDto[];
}

export class BudgetQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['draft', 'sent', 'approved', 'rejected'])
  status?: BudgetStatus;

  @IsOptional()
  @IsUUID(4)
  template_id?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}

export class CalculateBudgetDto {
  @IsUUID(4, { message: 'template_id deve ser um UUID válido' })
  template_id: string;

  @IsArray({ message: 'items deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items: BudgetItemDto[];

  @IsOptional()
  @IsObject()
  context?: {
    currency?: string;
    tax_rates?: Record<string, number>;
    custom_rates?: Record<string, number>;
  };
}