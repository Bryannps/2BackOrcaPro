/**
 * Serviço para envio de emails
 * Utiliza Nodemailer para e    } else {
      // Usar credenciais configuradas
      console.log('✅ Usando configurações SMTP reais:');
      console.log('  Host:', this.configService.get('SMTP_HOST', 'smtp.gmail.com'));
      console.log('  Port:', this.configService.get('SMTP_PORT', 587));
      console.log('  User:', smtpUser);

      this.transporter = nodemailer.createTransporter({
        host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
        port: this.configService.get('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }ls com anexos
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Budget } from '../../modules/budgets/entities/budget.entity';

interface SendBudgetEmailData {
  to: string;
  subject?: string;
  message?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private transporterReady: Promise<void>;

  constructor(private configService: ConfigService) {
    // Forçar carregamento imediato das configurações
    console.log('🔧 Inicializando EmailService...');
    console.log('  .env SMTP_USER:', this.configService.get('SMTP_USER'));
    console.log('  .env SMTP_HOST:', this.configService.get('SMTP_HOST'));
    
    this.transporterReady = this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    // Verificar se temos credenciais configuradas
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    console.log('🔍 Verificando credenciais SMTP:');
    console.log('  SMTP_USER:', `"${smtpUser}"`);
    console.log('  SMTP_PASS:', `"${smtpPass ? smtpPass.substring(0, 4) + '***' : 'VAZIO'}"`);
    console.log('  SMTP_HOST:', `"${this.configService.get('SMTP_HOST')}"`);
    console.log('  SMTP_FROM:', `"${this.configService.get('SMTP_FROM')}"`);

    if (!smtpUser || !smtpPass) {
      console.log('⚠️  Credenciais não encontradas, usando conta de teste Ethereal');
      console.log('     Motivo:', {
        noUser: !smtpUser,
        noPass: !smtpPass
      });
      // Criar conta de teste Ethereal
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('📧 Usando conta de email de teste:');
      console.log('  Usuário:', testAccount.user);
      console.log('  Senha:', testAccount.pass);
      console.log('  Link para visualizar emails:', 'https://ethereal.email');
    } else {
      // Usar credenciais configuradas
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
        port: this.configService.get('SMTP_PORT', 587),
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

  /**
   * Envia orçamento por email com PDF anexado
   */
  async sendBudgetEmail(
    budget: Budget,
    pdfBuffer: Buffer,
    emailData: SendBudgetEmailData,
  ): Promise<void> {
    // Aguardar inicialização do transporter
    await this.transporterReady;

    const { to, subject, message } = emailData;

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const defaultSubject = `Orçamento: ${budget.title}`;
    const defaultMessage = `
      <h2>Orçamento Enviado</h2>
      <p>Prezado(a),</p>
      
      <p>Segue em anexo o orçamento <strong>"${budget.title}"</strong> solicitado.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Resumo do Orçamento</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>Título:</strong></td>
            <td style="padding: 8px 0;">${budget.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Valor Total:</strong></td>
            <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">${formatCurrency(budget.total_amount)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0;">
              <span style="background-color: ${budget.status === 'approved' ? '#16a34a' : '#6b7280'}; color: white; padding: 4px 8px; border-radius: 4px;">
                ${budget.status === 'draft' ? 'Rascunho' : budget.status === 'approved' ? 'Aprovado' : budget.status}
              </span>
            </td>
          </tr>
        </table>
      </div>
      
      <p>Para mais informações ou dúvidas, entre em contato conosco.</p>
      
      <p>Atenciosamente,<br>
      <strong>${budget.company?.name || 'Nossa Empresa'}</strong></p>
      
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #6b7280;">
        Este email foi gerado automaticamente pelo sistema OrcaPro.
      </p>
    `;

    const mailOptions = {
      from: this.configService.get('SMTP_FROM', 'orcapro@exemplo.com'),
      to: to,
      subject: subject || defaultSubject,
      html: message || defaultMessage,
      attachments: [
        {
          filename: `orcamento-${budget.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    try {
      console.log('📧 Iniciando envio de email...');
      console.log('  De:', this.configService.get('SMTP_FROM', 'orcapro@exemplo.com'));
      console.log('  Para:', to);
      console.log('  Assunto:', subject || defaultSubject);
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 Email enviado com sucesso!');
      console.log('  Message ID:', info.messageId);
      console.log('  Accepted:', info.accepted);
      console.log('  Rejected:', info.rejected);
      console.log('  Response:', info.response);
      
      return info;
    } catch (error) {
      console.error('❌ Erro detalhado ao enviar email:', error);
      console.error('  SMTP Config:', {
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT'),
        user: this.configService.get('SMTP_USER'),
        from: this.configService.get('SMTP_FROM')
      });
      throw new Error('Falha ao enviar email');
    }
  }

  /**
   * Verifica se o serviço de email está funcionando
   */
  async verifyConnection(): Promise<boolean> {
    await this.transporterReady;
    
    try {
      await this.transporter.verify();
      console.log('✅ Conexão SMTP verificada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão SMTP:', error);
      return false;
    }
  }
}