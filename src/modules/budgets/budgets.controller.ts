/**
 * Controller de Budgets (Orçamentos)
 * Endpoints para CRUD de orçamentos e cálculos
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetQueryDto,
  CalculateBudgetDto,
} from './dto/budget.dto';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  /**
   * Criar novo orçamento
   * POST /api/budgets
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createBudgetDto: CreateBudgetDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const budget = await this.budgetsService.create(
      req.user.id,
      createBudgetDto,
    );

    return {
      success: true,
      message: 'Orçamento criado com sucesso',
      data: budget,
    };
  }

  /**
   * Listar orçamentos com filtros
   * GET /api/budgets
   */
  @Get()
  async findAll(
    @Request() req,
    @Query() queryDto: BudgetQueryDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
    pagination: any;
  }> {
    const result = await this.budgetsService.findAll(req.user.id, queryDto);

    return {
      success: true,
      message: 'Orçamentos listados com sucesso',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Buscar orçamento por ID
   * GET /api/budgets/:id
   */
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id') id: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const budget = await this.budgetsService.findOne(id, req.user.id);

    return {
      success: true,
      message: 'Orçamento encontrado com sucesso',
      data: budget,
    };
  }

  /**
   * Atualizar orçamento
   * PUT /api/budgets/:id
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const budget = await this.budgetsService.update(
      id,
      req.user.id,
      updateBudgetDto,
    );

    return {
      success: true,
      message: 'Orçamento atualizado com sucesso',
      data: budget,
    };
  }

  /**
   * Remover orçamento
   * DELETE /api/budgets/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    await this.budgetsService.remove(id, req.user.id);
  }

  /**
   * Calcular orçamento sem salvar
   * POST /api/budgets/calculate
   */
  @Post('calculate')
  async calculate(
    @Request() req,
    @Body() calculateDto: CalculateBudgetDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const result = await this.budgetsService.calculate(
      req.user.id,
      calculateDto,
    );

    return result;
  }

  /**
   * Duplicar orçamento
   * POST /api/budgets/:id/duplicate
   */
  @Post(':id/duplicate')
  async duplicate(
    @Request() req,
    @Param('id') id: string,
    @Body('title') newTitle?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const budget = await this.budgetsService.duplicate(
      id,
      req.user.id,
      newTitle,
    );

    return {
      success: true,
      message: 'Orçamento duplicado com sucesso',
      data: budget,
    };
  }

  /**
   * Alterar status do orçamento
   * PATCH /api/budgets/:id/status
   */
  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: 'draft' | 'sent' | 'approved' | 'rejected',
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const budget = await this.budgetsService.updateStatus(
      id,
      req.user.id,
      status,
    );

    const statusMessages = {
      draft: 'movido para rascunho',
      sent: 'enviado',
      approved: 'aprovado',
      rejected: 'rejeitado',
    };

    return {
      success: true,
      message: `Orçamento ${statusMessages[status]} com sucesso`,
      data: budget,
    };
  }

  /**
   * Estatísticas de orçamentos
   * GET /api/budgets/stats/summary
   */
  @Get('stats/summary')
  async getStats(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const stats = await this.budgetsService.getStats(req.user.id);

    return {
      success: true,
      message: 'Estatísticas obtidas com sucesso',
      data: stats,
    };
  }
}