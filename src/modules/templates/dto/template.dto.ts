/**
 * DTOs para Templates
 * Define estruturas de dados para CRUD de templates
 */

import {
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  IsObject,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType } from '../entities/budget-field.entity';

export class CreateFieldDto {
  @IsString({ message: 'Label do campo é obrigatório' })
  @MinLength(1, { message: 'Label deve ter pelo menos 1 caractere' })
  @MaxLength(255, { message: 'Label não pode exceder 255 caracteres' })
  label: string;

  @IsEnum(['text', 'number', 'select', 'date', 'boolean', 'calculated'], {
    message: 'Tipo deve ser: text, number, select, date, boolean ou calculated',
  })
  type: FieldType;

  @IsBoolean({ message: 'Required deve ser verdadeiro ou falso' })
  @IsOptional()
  required?: boolean;

  @IsOptional()
  @IsObject()
  options?: any;

  @IsOptional()
  @IsString()
  validation?: string;

  @IsNumber({}, { message: 'Order deve ser um número' })
  @Min(0, { message: 'Order deve ser maior ou igual a 0' })
  order: number;

  @IsOptional()
  @IsObject()
  calculation?: {
    is_calculated: boolean;
    formula: string;
    depends_on: string[];
  };
}

export class CreateCategoryDto {
  @IsString({ message: 'Nome da categoria é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Nome não pode exceder 255 caracteres' })
  name: string;

  @IsNumber({}, { message: 'Order deve ser um número' })
  @Min(0, { message: 'Order deve ser maior ou igual a 0' })
  order: number;

  @IsBoolean({ message: 'is_repeatable deve ser verdadeiro ou falso' })
  @IsOptional()
  is_repeatable?: boolean;

  @IsArray({ message: 'Fields deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  fields: CreateFieldDto[];

  @IsOptional()
  @IsObject()
  validation_rules?: Record<string, any>;
}

export class CreateTemplateDto {
  @IsString({ message: 'Nome do template é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Nome não pode exceder 255 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Descrição não pode exceder 1000 caracteres' })
  description?: string;

  @IsArray({ message: 'Categories deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CreateCategoryDto)
  categories: CreateCategoryDto[];

  @IsOptional()
  @IsObject()
  calculation_rules?: {
    formula: string;
    variables: string[];
    conditions: any[];
    strategy?: string;
  };
}

export class UpdateFieldDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString({ message: 'Label do campo é obrigatório' })
  @MinLength(1, { message: 'Label deve ter pelo menos 1 caractere' })
  @MaxLength(255, { message: 'Label não pode exceder 255 caracteres' })
  label: string;

  @IsEnum(['text', 'number', 'select', 'date', 'boolean', 'calculated'], {
    message: 'Tipo deve ser: text, number, select, date, boolean ou calculated',
  })
  type: FieldType;

  @IsBoolean({ message: 'Required deve ser verdadeiro ou falso' })
  @IsOptional()
  required?: boolean;

  @IsOptional()
  @IsObject()
  options?: any;

  @IsOptional()
  @IsString()
  validation?: string;

  @IsNumber({}, { message: 'Order deve ser um número' })
  @Min(0, { message: 'Order deve ser maior ou igual a 0' })
  order: number;

  @IsOptional()
  @IsObject()
  calculation?: {
    is_calculated: boolean;
    formula: string;
    depends_on: string[];
  };
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString({ message: 'Nome da categoria é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Nome não pode exceder 255 caracteres' })
  name: string;

  @IsNumber({}, { message: 'Order deve ser um número' })
  @Min(0, { message: 'Order deve ser maior ou igual a 0' })
  order: number;

  @IsBoolean({ message: 'is_repeatable deve ser verdadeiro ou falso' })
  @IsOptional()
  is_repeatable?: boolean;

  @IsArray({ message: 'Fields deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateFieldDto)
  fields: UpdateFieldDto[];

  @IsOptional()
  @IsObject()
  validation_rules?: Record<string, any>;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString({ message: 'Nome do template deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(255, { message: 'Nome não pode exceder 255 caracteres' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Descrição não pode exceder 1000 caracteres' })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active deve ser verdadeiro ou falso' })
  is_active?: boolean;

  @IsOptional()
  @IsArray({ message: 'Categories deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateCategoryDto)
  categories?: UpdateCategoryDto[];

  @IsOptional()
  @IsObject()
  calculation_rules?: {
    formula: string;
    variables: string[];
    conditions: any[];
    strategy?: string;
  };
}

export class TemplateQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

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