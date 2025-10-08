/**
 * Service de Budgets (Orçamentos)
 * Lógica de negócio para CRUD de orçamentos
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { BudgetItem } from './entities/budget-item.entity';
import { BudgetTemplate } from '../templates/entities/budget-template.entity';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetQueryDto,
  CalculateBudgetDto,
} from './dto/budget.dto';
import { CalculationEngine } from './calculation/calculation.engine';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private readonly itemRepository: Repository<BudgetItem>,
    @InjectRepository(BudgetTemplate)
    private readonly templateRepository: Repository<BudgetTemplate>,
    private readonly calculationEngine: CalculationEngine,
  ) {}

  /**
   * Criar novo orçamento
   */
  async create(
    companyId: string,
    createBudgetDto: CreateBudgetDto,
  ): Promise<Budget> {
    // Buscar e validar template
    const template = await this.templateRepository.findOne({
      where: { id: createBudgetDto.template_id, company_id: companyId },
      relations: ['categories', 'categories.fields'],
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    if (!template.is_active) {
      throw new BadRequestException('Template inativo não pode ser usado');
    }

    // Calcular valores
    const calculationResult = await this.calculationEngine.calculate(
      template,
      createBudgetDto.items,
      companyId,
    );

    // Salvar orçamento
    const savedBudget = await this.budgetRepository.manager.transaction(async (manager) => {
      const budget = manager.create(Budget, {
        company_id: companyId,
        template_id: createBudgetDto.template_id,
        title: createBudgetDto.title,
        total_amount: calculationResult.total,
        status: 'draft',
        custom_data: {
          subtotals: calculationResult.subtotals,
          metadata: calculationResult.metadata,
        },
      });

      const savedBudget = await manager.save(budget);

      // Salvar items
      const budgetItems = calculationResult.items.map(item =>
        manager.create(BudgetItem, {
          budget_id: savedBudget.id,
          category_id: item.category_id,
          field_values: item.field_values,
          amount: item.amount,
          order: item.order,
        })
      );

      await manager.save(BudgetItem, budgetItems);

      return savedBudget;
    });

    // Buscar o orçamento completo após a transação ser commitada
    return this.findOne(savedBudget.id, companyId);
  }

  /**
   * Listar orçamentos com filtros e paginação
   */
  async findAll(
    companyId: string,
    queryDto: BudgetQueryDto,
  ): Promise<{
    data: Budget[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, status, template_id, page = 1, limit = 10 } = queryDto;

    const queryBuilder = this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.company', 'company')
      .leftJoinAndSelect('budget.template', 'template')
      .leftJoinAndSelect('budget.items', 'item')
      .leftJoinAndSelect('item.category', 'category')
      .where('budget.company_id = :companyId', { companyId })
      .orderBy('budget.created_at', 'DESC');

    // Filtro por título
    if (search) {
      queryBuilder.andWhere('budget.title ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Filtro por status
    if (status) {
      queryBuilder.andWhere('budget.status = :status', { status });
    }

    // Filtro por template
    if (template_id) {
      queryBuilder.andWhere('budget.template_id = :template_id', { template_id });
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
   * Buscar orçamento por ID
   */
  async findOne(id: string, companyId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id, company_id: companyId },
      relations: [
        'company',
        'template',
        'template.categories',
        'template.categories.fields',
        'items',
        'items.category',
      ],
    });

    if (!budget) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return budget;
  }

  /**
   * Atualizar orçamento
   */
  async update(
    id: string,
    companyId: string,
    updateBudgetDto: UpdateBudgetDto,
  ): Promise<Budget> {
    const budget = await this.findOne(id, companyId);

    // Verificar se pode editar (apenas rascunhos)
    if (budget.status !== 'draft' && updateBudgetDto.items) {
      throw new BadRequestException(
        'Não é possível editar items de orçamento que não seja rascunho'
      );
    }

    return this.budgetRepository.manager.transaction(async (manager) => {
      // Atualizar dados básicos
      if (updateBudgetDto.title) {
        budget.title = updateBudgetDto.title;
      }

      if (updateBudgetDto.status) {
        budget.status = updateBudgetDto.status;
      }

      // Se atualizou items, recalcular
      if (updateBudgetDto.items) {
        const template = await this.templateRepository.findOne({
          where: { id: budget.template_id },
          relations: ['categories', 'categories.fields'],
        });

        const calculationResult = await this.calculationEngine.calculate(
          template,
          updateBudgetDto.items,
          companyId,
        );

        budget.total_amount = calculationResult.total;
        budget.custom_data = {
          subtotals: calculationResult.subtotals,
          metadata: calculationResult.metadata,
        };

        // Remover items antigos
        await manager.delete(BudgetItem, { budget_id: budget.id });

        // Criar novos items
        const budgetItems = calculationResult.items.map(item =>
          manager.create(BudgetItem, {
            budget_id: budget.id,
            category_id: item.category_id,
            field_values: item.field_values,
            amount: item.amount,
            order: item.order,
          })
        );

        await manager.save(BudgetItem, budgetItems);
      }

      await manager.save(budget);
      return this.findOne(budget.id, companyId);
    });
  }

  /**
   * Remover orçamento
   */
  async remove(id: string, companyId: string): Promise<void> {
    const budget = await this.findOne(id, companyId);

    // Verificar se pode deletar (apenas rascunhos)
    if (budget.status !== 'draft') {
      throw new BadRequestException(
        'Apenas orçamentos em rascunho podem ser excluídos'
      );
    }

    // Usar transação para deletar itens primeiro e depois o orçamento
    await this.budgetRepository.manager.transaction(async (manager) => {
      // Deletar primeiro os itens do orçamento
      await manager.delete(BudgetItem, { budget_id: id });
      
      // Depois deletar o orçamento
      await manager.delete(Budget, { id, company_id: companyId });
    });
  }

  /**
   * Calcular orçamento sem salvar
   */
  async calculate(
    companyId: string,
    calculateDto: CalculateBudgetDto,
  ): Promise<any> {
    // Buscar template
    const template = await this.templateRepository.findOne({
      where: { id: calculateDto.template_id, company_id: companyId },
      relations: ['categories', 'categories.fields'],
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    // Calcular
    const result = await this.calculationEngine.calculate(
      template,
      calculateDto.items,
      companyId,
    );

    return {
      success: true,
      message: 'Cálculo realizado com sucesso',
      data: result,
    };
  }

  /**
   * Duplicar orçamento
   */
  async duplicate(
    id: string,
    companyId: string,
    newTitle?: string,
  ): Promise<Budget> {
    const originalBudget = await this.findOne(id, companyId);

    const createDto: CreateBudgetDto = {
      template_id: originalBudget.template_id,
      title: newTitle || `${originalBudget.title} - Cópia`,
      items: originalBudget.items.map(item => ({
        category_id: item.category_id,
        field_values: item.field_values,
        order: item.order,
      })),
    };

    return this.create(companyId, createDto);
  }

  /**
   * Alterar status do orçamento
   */
  async updateStatus(
    id: string,
    companyId: string,
    newStatus: 'draft' | 'sent' | 'approved' | 'rejected',
  ): Promise<Budget> {
    const budget = await this.findOne(id, companyId);

    // Validar transições de status
    const validTransitions: Record<string, string[]> = {
      draft: ['sent'],
      sent: ['approved', 'rejected', 'draft'],
      approved: ['draft'], // Para criar revisão
      rejected: ['draft'], // Para corrigir e reenviar
    };

    if (!validTransitions[budget.status]?.includes(newStatus)) {
      throw new BadRequestException(
        `Não é possível alterar status de "${budget.status}" para "${newStatus}"`
      );
    }

    budget.status = newStatus as any;
    await this.budgetRepository.save(budget);

    return this.findOne(id, companyId);
  }

  /**
   * Obter estatísticas de orçamentos
   */
  async getStats(companyId: string): Promise<any> {
    const stats = await this.budgetRepository
      .createQueryBuilder('budget')
      .select([
        'COUNT(*) as total_budgets',
        'COUNT(CASE WHEN status = \'draft\' THEN 1 END) as draft_budgets',
        'COUNT(CASE WHEN status = \'sent\' THEN 1 END) as sent_budgets',
        'COUNT(CASE WHEN status = \'approved\' THEN 1 END) as approved_budgets',
        'COUNT(CASE WHEN status = \'rejected\' THEN 1 END) as rejected_budgets',
        'SUM(total_amount) as total_value',
        'SUM(CASE WHEN status = \'approved\' THEN total_amount ELSE 0 END) as approved_value',
      ])
      .where('company_id = :companyId', { companyId })
      .getRawOne();

    return {
      total_budgets: parseInt(stats.total_budgets) || 0,
      draft_budgets: parseInt(stats.draft_budgets) || 0,
      sent_budgets: parseInt(stats.sent_budgets) || 0,
      approved_budgets: parseInt(stats.approved_budgets) || 0,
      rejected_budgets: parseInt(stats.rejected_budgets) || 0,
      total_value: parseFloat(stats.total_value) || 0,
      approved_value: parseFloat(stats.approved_value) || 0,
    };
  }
}