/**
 * Service principal da aplicação
 * Fornece lógica de negócio para endpoints básicos
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Retorna mensagem básica de funcionamento
   */
  getHello(): string {
    return 'Sistema de Orçamentos - API funcionando corretamente! 🚀';
  }

  /**
   * Retorna status detalhado da aplicação
   */
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV', 'development'),
      database: 'connected', // TODO: Implementar verificação real do banco
      api: {
        name: 'Sistema de Orçamentos API',
        description: 'API REST para sistema de orçamentos flexível',
        docs: '/api/docs'
      }
    };
  }
}