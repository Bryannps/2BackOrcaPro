/**
 * Migration inicial - Criação de todas as tabelas do sistema
 * Implementa o modelo de dados completo para o sistema de orçamentos
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1696700000000 implements MigrationInterface {
  name = 'CreateInitialTables1696700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar extensão UUID
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Criar enum types
    await queryRunner.query(`
      CREATE TYPE budget_status_enum AS ENUM ('draft', 'sent', 'approved', 'rejected');
      CREATE TYPE field_type_enum AS ENUM ('text', 'number', 'select', 'date', 'boolean', 'calculated');
    `);

    // Tabela companies
    await queryRunner.query(`
      CREATE TABLE companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        document VARCHAR(20),
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabela budget_templates
    await queryRunner.query(`
      CREATE TABLE budget_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        calculation_rules JSONB DEFAULT '{"formula": "", "variables": [], "conditions": []}',
        company_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );
    `);

    // Tabela budget_categories
    await queryRunner.query(`
      CREATE TABLE budget_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        "order" INTEGER DEFAULT 0,
        is_repeatable BOOLEAN DEFAULT false,
        validation_rules JSONB DEFAULT '{}',
        template_id UUID NOT NULL,
        FOREIGN KEY (template_id) REFERENCES budget_templates(id) ON DELETE CASCADE
      );
    `);

    // Tabela budget_fields
    await queryRunner.query(`
      CREATE TABLE budget_fields (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        label VARCHAR(255) NOT NULL,
        type field_type_enum DEFAULT 'text',
        required BOOLEAN DEFAULT false,
        options JSONB,
        validation TEXT,
        "order" INTEGER DEFAULT 0,
        calculation JSONB DEFAULT '{"is_calculated": false, "formula": "", "depends_on": []}',
        category_id UUID NOT NULL,
        FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE
      );
    `);

    // Tabela budgets
    await queryRunner.query(`
      CREATE TABLE budgets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        status budget_status_enum DEFAULT 'draft',
        custom_data JSONB DEFAULT '{}',
        total_amount DECIMAL(15,2) DEFAULT 0,
        version INTEGER DEFAULT 1,
        company_id UUID NOT NULL,
        template_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (template_id) REFERENCES budget_templates(id) ON DELETE RESTRICT
      );
    `);

    // Tabela budget_items
    await queryRunner.query(`
      CREATE TABLE budget_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        field_values JSONB NOT NULL,
        amount DECIMAL(15,2) DEFAULT 0,
        "order" INTEGER DEFAULT 0,
        budget_id UUID NOT NULL,
        category_id UUID NOT NULL,
        FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE RESTRICT
      );
    `);

    // Criar índices para performance
    await queryRunner.query(`
      CREATE INDEX idx_budgets_company_status ON budgets(company_id, status);
      CREATE INDEX idx_budgets_created_at ON budgets(created_at);
      CREATE INDEX idx_templates_company_active ON budget_templates(company_id, is_active);
      CREATE INDEX idx_budget_items_budget_id ON budget_items(budget_id);
      CREATE INDEX idx_budget_categories_template_id ON budget_categories(template_id);
      CREATE INDEX idx_budget_fields_category_id ON budget_fields(category_id);
    `);

    // Função para atualizar updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger para updated_at na tabela companies
    await queryRunner.query(`
      CREATE TRIGGER update_companies_updated_at
        BEFORE UPDATE ON companies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;`);
    
    // Drop função
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column();`);
    
    // Drop índices
    await queryRunner.query(`DROP INDEX IF EXISTS idx_budgets_company_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_budgets_created_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_templates_company_active;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_budget_items_budget_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_budget_categories_template_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_budget_fields_category_id;`);
    
    // Drop tabelas na ordem correta (reversa)
    await queryRunner.query(`DROP TABLE IF EXISTS budget_items;`);
    await queryRunner.query(`DROP TABLE IF EXISTS budgets;`);
    await queryRunner.query(`DROP TABLE IF EXISTS budget_fields;`);
    await queryRunner.query(`DROP TABLE IF EXISTS budget_categories;`);
    await queryRunner.query(`DROP TABLE IF EXISTS budget_templates;`);
    await queryRunner.query(`DROP TABLE IF EXISTS companies;`);
    
    // Drop types
    await queryRunner.query(`DROP TYPE IF EXISTS budget_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS field_type_enum;`);
  }
}