/**
 * Seeds para dados iniciais do sistema
 * Cria uma empresa exemplo com template básico
 */

import { DataSource } from 'typeorm';
import { Company } from '../../modules/companies/entities/company.entity';
import { BudgetTemplate } from '../../modules/templates/entities/budget-template.entity';
import { BudgetCategory } from '../../modules/templates/entities/budget-category.entity';
import { BudgetField } from '../../modules/templates/entities/budget-field.entity';

export class SeedData {
  constructor(private dataSource: DataSource) {}

  async run() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Criar empresa exemplo
      const company = queryRunner.manager.create(Company, {
        name: 'Agilizar Soluções',
        email: 'contato@agilizar.com',
        document: '12.345.678/0001-90',
        settings: {
          currency: 'BRL',
          tax_rate: 0.18,
          profit_margin: 0.30,
        },
      });

      const savedCompany = await queryRunner.manager.save(company);

      // Criar template básico
      const template = queryRunner.manager.create(BudgetTemplate, {
        name: 'Template Básico - Serviços',
        description: 'Template padrão para orçamentos de serviços',
        company_id: savedCompany.id,
        is_active: true,
        calculation_rules: {
          formula: 'SUM(categories) * (1 + tax_rate) * (1 + profit_margin)',
          variables: ['tax_rate', 'profit_margin'],
          conditions: [],
          strategy: 'service',
        },
      });

      const savedTemplate = await queryRunner.manager.save(template);

      // Categoria 1: Recursos Humanos
      const categoryRH = queryRunner.manager.create(BudgetCategory, {
        name: 'Recursos Humanos',
        order: 1,
        is_repeatable: true,
        template_id: savedTemplate.id,
        validation_rules: {},
      });

      const savedCategoryRH = await queryRunner.manager.save(categoryRH);

      // Campos da categoria RH
      const fieldsRH = [
        {
          label: 'Função/Cargo',
          type: 'text' as const,
          required: true,
          order: 1,
          category_id: savedCategoryRH.id,
        },
        {
          label: 'Quantidade de Horas',
          type: 'number' as const,
          required: true,
          order: 2,
          category_id: savedCategoryRH.id,
          validation: 'min:1,max:1000',
        },
        {
          label: 'Valor por Hora (R$)',
          type: 'number' as const,
          required: true,
          order: 3,
          category_id: savedCategoryRH.id,
          validation: 'min:0',
        },
        {
          label: 'Total',
          type: 'calculated' as const,
          required: false,
          order: 4,
          category_id: savedCategoryRH.id,
          calculation: {
            is_calculated: true,
            formula: 'quantidade_horas * valor_por_hora',
            depends_on: ['quantidade_horas', 'valor_por_hora'],
          },
        },
      ];

      for (const field of fieldsRH) {
        const budgetField = queryRunner.manager.create(BudgetField, field);
        await queryRunner.manager.save(budgetField);
      }

      // Categoria 2: Materiais e Equipamentos
      const categoryMat = queryRunner.manager.create(BudgetCategory, {
        name: 'Materiais e Equipamentos',
        order: 2,
        is_repeatable: true,
        template_id: savedTemplate.id,
        validation_rules: {},
      });

      const savedCategoryMat = await queryRunner.manager.save(categoryMat);

      // Campos da categoria Materiais
      const fieldsMat = [
        {
          label: 'Descrição do Item',
          type: 'text' as const,
          required: true,
          order: 1,
          category_id: savedCategoryMat.id,
        },
        {
          label: 'Quantidade',
          type: 'number' as const,
          required: true,
          order: 2,
          category_id: savedCategoryMat.id,
          validation: 'min:1',
        },
        {
          label: 'Valor Unitário (R$)',
          type: 'number' as const,
          required: true,
          order: 3,
          category_id: savedCategoryMat.id,
          validation: 'min:0',
        },
        {
          label: 'Total',
          type: 'calculated' as const,
          required: false,
          order: 4,
          category_id: savedCategoryMat.id,
          calculation: {
            is_calculated: true,
            formula: 'quantidade * valor_unitario',
            depends_on: ['quantidade', 'valor_unitario'],
          },
        },
      ];

      for (const field of fieldsMat) {
        const budgetField = queryRunner.manager.create(BudgetField, field);
        await queryRunner.manager.save(budgetField);
      }

      // Categoria 3: Despesas Adicionais
      const categoryDesp = queryRunner.manager.create(BudgetCategory, {
        name: 'Despesas Adicionais',
        order: 3,
        is_repeatable: true,
        template_id: savedTemplate.id,
        validation_rules: {},
      });

      const savedCategoryDesp = await queryRunner.manager.save(categoryDesp);

      // Campos da categoria Despesas
      const fieldsDesp = [
        {
          label: 'Tipo de Despesa',
          type: 'select' as const,
          required: true,
          order: 1,
          category_id: savedCategoryDesp.id,
          options: {
            values: ['Transporte', 'Hospedagem', 'Alimentação', 'Outros'],
          },
        },
        {
          label: 'Descrição',
          type: 'text' as const,
          required: false,
          order: 2,
          category_id: savedCategoryDesp.id,
        },
        {
          label: 'Valor (R$)',
          type: 'number' as const,
          required: true,
          order: 3,
          category_id: savedCategoryDesp.id,
          validation: 'min:0',
        },
      ];

      for (const field of fieldsDesp) {
        const budgetField = queryRunner.manager.create(BudgetField, field);
        await queryRunner.manager.save(budgetField);
      }

      await queryRunner.commitTransaction();
      console.log('✅ Seeds executados com sucesso!');
      console.log(`📝 Empresa criada: ${savedCompany.name}`);
      console.log(`📋 Template criado: ${savedTemplate.name}`);
      console.log(`📊 Categorias criadas: 3`);
      console.log(`🏷️  Campos criados: ${fieldsRH.length + fieldsMat.length + fieldsDesp.length}`);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Erro ao executar seeds:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// Script para executar os seeds
async function runSeeds() {
  const { default: dataSource } = await import('../../config/database.config');
  
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const seedData = new SeedData(dataSource);
  await seedData.run();
  
  await dataSource.destroy();
}

// Executar seeds se chamado diretamente
if (require.main === module) {
  runSeeds().catch(console.error);
}