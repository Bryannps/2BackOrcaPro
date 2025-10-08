/**
 * Service de Companies
 * Lógica de negócio para gerenciar empresas
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * Busca empresa por ID
   */
  async findById(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return company;
  }

  /**
   * Busca empresa por email
   */
  async findByEmail(email: string): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { email },
    });
  }

  /**
   * Atualiza configurações da empresa
   */
  async updateSettings(id: string, settings: Record<string, any>): Promise<Company> {
    const company = await this.findById(id);
    
    company.settings = {
      ...company.settings,
      ...settings,
    };

    return this.companyRepository.save(company);
  }

  /**
   * Lista estatísticas da empresa
   */
  async getStats(companyId: string): Promise<any> {
    // TODO: Implementar estatísticas reais quando tivermos templates e orçamentos
    return {
      total_templates: 0,
      total_budgets: 0,
      total_budget_value: 0,
      active_templates: 0,
      draft_budgets: 0,
      approved_budgets: 0,
    };
  }
}