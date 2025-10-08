/**
 * Controller de Companies
 * Endpoints para gerenciar informações da empresa
 */

import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/auth.guards';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * Informações da empresa logada
   * GET /api/companies/me
   */
  @Get('me')
  async getMyCompany(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const company = await this.companiesService.findById(req.user.id);
    
    return {
      success: true,
      message: 'Dados da empresa obtidos com sucesso',
      data: {
        id: company.id,
        name: company.name,
        email: company.email,
        document: company.document,
        settings: company.settings,
        created_at: company.created_at,
      },
    };
  }

  /**
   * Atualizar configurações da empresa
   * PATCH /api/companies/settings
   */
  @Patch('settings')
  async updateSettings(
    @Request() req,
    @Body() settings: Record<string, any>,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const updatedCompany = await this.companiesService.updateSettings(
      req.user.id,
      settings,
    );
    
    return {
      success: true,
      message: 'Configurações atualizadas com sucesso',
      data: {
        settings: updatedCompany.settings,
      },
    };
  }

  /**
   * Estatísticas da empresa
   * GET /api/companies/stats
   */
  @Get('stats')
  async getStats(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const stats = await this.companiesService.getStats(req.user.id);
    
    return {
      success: true,
      message: 'Estatísticas obtidas com sucesso',
      data: stats,
    };
  }
}