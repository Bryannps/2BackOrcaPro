/**
 * Controller de Templates
 * Endpoints para CRUD de templates de orçamento
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQueryDto,
} from './dto/template.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * Criar novo template
   * POST /api/templates
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createTemplateDto: CreateTemplateDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const template = await this.templatesService.create(
      req.user.id,
      createTemplateDto,
    );

    return {
      success: true,
      message: 'Template criado com sucesso',
      data: template,
    };
  }

  /**
   * Listar templates com filtros
   * GET /api/templates
   */
  @Get()
  async findAll(
    @Request() req,
    @Query() queryDto: TemplateQueryDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
    pagination: any;
  }> {
    const result = await this.templatesService.findAll(req.user.id, queryDto);

    return {
      success: true,
      message: 'Templates listados com sucesso',
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
   * Buscar template por ID
   * GET /api/templates/:id
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
    const template = await this.templatesService.findOne(id, req.user.id);

    return {
      success: true,
      message: 'Template encontrado com sucesso',
      data: template,
    };
  }

  /**
   * Atualizar template
   * PUT /api/templates/:id
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const template = await this.templatesService.update(
      id,
      req.user.id,
      updateTemplateDto,
    );

    return {
      success: true,
      message: 'Template atualizado com sucesso',
      data: template,
    };
  }

  /**
   * Remover template
   * DELETE /api/templates/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    await this.templatesService.remove(id, req.user.id);
  }

  /**
   * Duplicar template
   * POST /api/templates/:id/duplicate
   */
  @Post(':id/duplicate')
  async duplicate(
    @Request() req,
    @Param('id') id: string,
    @Body('name') newName?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const template = await this.templatesService.duplicate(
      id,
      req.user.id,
      newName,
    );

    return {
      success: true,
      message: 'Template duplicado com sucesso',
      data: template,
    };
  }

  /**
   * Alternar status ativo/inativo
   * PATCH /api/templates/:id/toggle-active
   */
  @Post(':id/toggle-active')
  async toggleActive(
    @Request() req,
    @Param('id') id: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const template = await this.templatesService.toggleActive(id, req.user.id);

    return {
      success: true,
      message: `Template ${template.is_active ? 'ativado' : 'desativado'} com sucesso`,
      data: template,
    };
  }
}