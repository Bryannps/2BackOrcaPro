/**
 * Service de Templates
 * Lógica de negócio para CRUD de templates, categorias e campos
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BudgetTemplate } from './entities/budget-template.entity';
import { BudgetCategory } from './entities/budget-category.entity';
import { BudgetField } from './entities/budget-field.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQueryDto,
} from './dto/template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(BudgetTemplate)
    private readonly templateRepository: Repository<BudgetTemplate>,
    @InjectRepository(BudgetCategory)
    private readonly categoryRepository: Repository<BudgetCategory>,
    @InjectRepository(BudgetField)
    private readonly fieldRepository: Repository<BudgetField>,
  ) {}

  /**
   * Criar um novo template
   */
  async create(
    companyId: string,
    createTemplateDto: CreateTemplateDto,
  ): Promise<BudgetTemplate> {
    return this.templateRepository.manager.transaction(async (manager) => {
      // Criar template
      const template = manager.create(BudgetTemplate, {
        company_id: companyId,
        name: createTemplateDto.name,
        description: createTemplateDto.description,
        calculation_rules: createTemplateDto.calculation_rules || {
          formula: '',
          variables: [],
          conditions: [],
          strategy: 'default',
        },
      });

      const savedTemplate = await manager.save(template);

      // Criar categorias e campos
      for (const categoryDto of createTemplateDto.categories) {
        const category = manager.create(BudgetCategory, {
          template_id: savedTemplate.id,
          name: categoryDto.name,
          order: categoryDto.order,
          is_repeatable: categoryDto.is_repeatable || false,
          validation_rules: categoryDto.validation_rules || {},
        });

        const savedCategory = await manager.save(category);

        // Criar campos da categoria
        const fieldEntities = categoryDto.fields.map(fieldDto =>
          manager.create(BudgetField, {
            category_id: savedCategory.id,
            label: fieldDto.label,
            type: fieldDto.type,
            required: fieldDto.required || false,
            options: fieldDto.options,
            validation: fieldDto.validation,
            order: fieldDto.order,
            calculation: fieldDto.calculation || {
              is_calculated: false,
              formula: '',
              depends_on: [],
            },
          })
        );

        await manager.save(BudgetField, fieldEntities);
      }

      // Retornar template completo com relacionamentos
      return manager.findOne(BudgetTemplate, {
        where: { id: savedTemplate.id },
        relations: ['categories', 'categories.fields'],
      });
    });
  }

  /**
   * Listar templates com filtros e paginação
   */
  async findAll(
    companyId: string,
    queryDto: TemplateQueryDto,
  ): Promise<{
    data: BudgetTemplate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, is_active, page = 1, limit = 10 } = queryDto;

    const queryBuilder = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.categories', 'category')
      .leftJoinAndSelect('category.fields', 'field')
      .where('template.company_id = :companyId', { companyId })
      .orderBy('template.created_at', 'DESC')
      .addOrderBy('category.order', 'ASC')
      .addOrderBy('field.order', 'ASC');

    // Filtro por nome
    if (search) {
      queryBuilder.andWhere('template.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Filtro por ativo
    if (typeof is_active === 'boolean') {
      queryBuilder.andWhere('template.is_active = :is_active', { is_active });
    }

    // Paginação
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Buscar template por ID
   */
  async findOne(id: string, companyId: string): Promise<BudgetTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['categories', 'categories.fields'],
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    return template;
  }

  /**
   * Atualizar template
   */
  async update(
    id: string,
    companyId: string,
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<BudgetTemplate> {
    const template = await this.findOne(id, companyId);

    return await this.templateRepository.manager.transaction(async (manager) => {
      // 1. Atualizar campos básicos do template
      const { categories, ...templateData } = updateTemplateDto;
      Object.assign(template, templateData);
      const updatedTemplate = await manager.save(BudgetTemplate, template);

      // 2. Se categorias foram fornecidas, atualizar estrutura completa
      if (categories && categories.length > 0) {
        // Remover categorias e campos existentes
        const existingCategories = await manager.find(BudgetCategory, {
          where: { template_id: id }
        });

        for (const category of existingCategories) {
          await manager.delete(BudgetField, { category_id: category.id });
        }
        await manager.delete(BudgetCategory, { template_id: id });

        // Criar novas categorias e campos
        for (const categoryDto of categories) {
          const { fields, id: categoryId, ...categoryData } = categoryDto;
          
          const category = manager.create(BudgetCategory, {
            ...categoryData,
            template_id: updatedTemplate.id,
          });

          const savedCategory = await manager.save(BudgetCategory, category);

          // Criar campos da categoria
          for (const fieldDto of fields) {
            const { id: fieldId, ...fieldData } = fieldDto;
            
            const field = manager.create(BudgetField, {
              ...fieldData,
              category_id: savedCategory.id,
            });

            await manager.save(BudgetField, field);
          }
        }
      }

      // Retornar template atualizado com relacionamentos
      return this.findOne(updatedTemplate.id, companyId);
    });
  }

  /**
   * Remover template
   */
  async remove(id: string, companyId: string): Promise<void> {
    const template = await this.findOne(id, companyId);

    // TODO: Verificar se template está sendo usado em orçamentos
    // Se sim, marcar como inativo ao invés de deletar

    // Usar transação para deletar em cascata
    await this.templateRepository.manager.transaction(async (manager) => {
      // 1. Buscar todas as categorias do template
      const categories = await manager.find(BudgetCategory, {
        where: { template_id: id }
      });

      // 2. Deletar primeiro os campos de cada categoria
      for (const category of categories) {
        await manager.delete(BudgetField, { category_id: category.id });
      }

      // 3. Deletar as categorias
      await manager.delete(BudgetCategory, { template_id: id });

      // 4. Finalmente deletar o template
      await manager.delete(BudgetTemplate, { id, company_id: companyId });
    });
  }

  /**
   * Duplicar template
   */
  async duplicate(
    id: string,
    companyId: string,
    newName?: string,
  ): Promise<BudgetTemplate> {
    const originalTemplate = await this.findOne(id, companyId);

    return this.templateRepository.manager.transaction(async (manager) => {
      // Criar novo template
      const duplicatedTemplate = manager.create(BudgetTemplate, {
        company_id: companyId,
        name: newName || `${originalTemplate.name} - Cópia`,
        description: originalTemplate.description,
        calculation_rules: originalTemplate.calculation_rules,
        is_active: false, // Começa inativo
      });

      const savedTemplate = await manager.save(duplicatedTemplate);

      // Duplicar categorias e campos
      for (const category of originalTemplate.categories) {
        const duplicatedCategory = manager.create(BudgetCategory, {
          template_id: savedTemplate.id,
          name: category.name,
          order: category.order,
          is_repeatable: category.is_repeatable,
          validation_rules: category.validation_rules,
        });

        const savedCategory = await manager.save(duplicatedCategory);

        // Duplicar campos
        const fieldEntities = category.fields.map(field =>
          manager.create(BudgetField, {
            category_id: savedCategory.id,
            label: field.label,
            type: field.type,
            required: field.required,
            options: field.options,
            validation: field.validation,
            order: field.order,
            calculation: field.calculation,
          })
        );

        await manager.save(BudgetField, fieldEntities);
      }

      // Retornar template duplicado completo
      return manager.findOne(BudgetTemplate, {
        where: { id: savedTemplate.id },
        relations: ['categories', 'categories.fields'],
      });
    });
  }

  /**
   * Alternar status ativo/inativo
   */
  async toggleActive(id: string, companyId: string): Promise<BudgetTemplate> {
    const template = await this.findOne(id, companyId);
    template.is_active = !template.is_active;
    
    await this.templateRepository.save(template);
    return this.findOne(id, companyId);
  }
}