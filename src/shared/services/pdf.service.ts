/**
 * Serviço para geração de PDFs de orçamentos
 * Utiliza Puppeteer para gerar PDFs a partir de HTML
 */

import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { Budget } from '../../modules/budgets/entities/budget.entity';

@Injectable()
export class PdfService {
  /**
   * Gera PDF de um orçamento
   */
  async generateBudgetPdf(budget: Budget): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // HTML template do orçamento
      const html = this.generateBudgetHtml(budget);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Gerar PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Gera HTML do orçamento para PDF
   */
  private generateBudgetHtml(budget: Budget): string {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('pt-BR');
    };

    // Extrair dados dos metadados
    const metadata = budget.custom_data?.metadata || {};
    const subtotals = budget.custom_data?.subtotals || {};

    // Processar itens
    const itemsHtml = budget.items
      .map((item) => {
        const fieldEntries = Object.entries(item.field_values || {});
        return fieldEntries
          .map(([fieldName, fieldData]) => {
            const value = typeof fieldData === 'object' ? (fieldData as any).value || 0 : fieldData;
            const unitCost = typeof fieldData === 'object' ? (fieldData as any).unit_cost || 0 : 0;
            const total = typeof value === 'number' && typeof unitCost === 'number' ? value * unitCost : 0;

            return `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${fieldName}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${value}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(unitCost)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${formatCurrency(total)}</td>
              </tr>
            `;
          })
          .join('');
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Orçamento - ${budget.title}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              color: #1f2937;
              line-height: 1.6;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .company-info {
              margin-bottom: 30px;
              padding: 15px;
              background-color: #f8fafc;
              border-radius: 8px;
            }
            .budget-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-block {
              padding: 15px;
              background-color: #f1f5f9;
              border-radius: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #374151;
              margin-bottom: 5px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              background-color: #e5e7eb;
              color: #374151;
            }
            .status-draft {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-approved {
              background-color: #d1fae5;
              color: #065f46;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              background-color: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            th {
              background-color: #3b82f6;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            th:last-child, td:last-child {
              text-align: right;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            .summary {
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
            }
            .summary-total {
              font-size: 18px;
              font-weight: bold;
              color: #3b82f6;
              border-top: 2px solid #e5e7eb;
              padding-top: 12px;
              margin-top: 8px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ORÇAMENTO</h1>
              <h2 style="margin: 0; color: #3b82f6;">${budget.title}</h2>
            </div>

            <div class="company-info">
              <div class="info-label">Empresa</div>
              <div>${budget.company?.name || 'Nome da empresa não informado'}</div>
              <div style="color: #6b7280;">${budget.company?.email || 'Email não informado'}</div>
            </div>

            <div class="budget-info">
              <div class="info-block">
                <div class="info-label">Descrição</div>
                <div>${budget.description || 'Nenhuma descrição fornecida'}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Template Utilizado</div>
                <div>${budget.template?.name || 'Template não informado'}</div>
                <div style="font-size: 12px; color: #6b7280;">${budget.template?.categories?.length || 0} categoria(s)</div>
              </div>
              <div class="info-block">
                <div class="info-label">Status</div>
                <span class="status-badge ${budget.status === 'approved' ? 'status-approved' : 'status-draft'}">
                  ${budget.status === 'draft' ? 'Rascunho' : budget.status === 'approved' ? 'Aprovado' : budget.status}
                </span>
              </div>
              <div class="info-block">
                <div class="info-label">Data de Criação</div>
                <div>${formatDate(budget.created_at?.toISOString ? budget.created_at.toISOString() : new Date().toISOString())}</div>
              </div>
            </div>

            <h3>Itens do Orçamento</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="summary">
              <h3 style="margin-top: 0;">Resumo Financeiro</h3>
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(metadata.base_total || 0)}</span>
              </div>
              <div class="summary-row">
                <span>Impostos:</span>
                <span style="color: #ea580c;">${formatCurrency(metadata.taxes || 0)}</span>
              </div>
              <div class="summary-row summary-total">
                <span>Total:</span>
                <span>${formatCurrency(budget.total_amount)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Orçamento gerado em ${formatDate(new Date().toISOString())}</p>
              <p>Este documento foi gerado automaticamente pelo sistema OrcaPro</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}