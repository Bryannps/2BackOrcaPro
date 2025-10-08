/**
 * Controller principal da aplicação
 * Fornece endpoints básicos de status e health check
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// @ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint de health check
   * Verifica se a aplicação está funcionando corretamente
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Endpoint de status da aplicação
   * Retorna informações básicas sobre o sistema
   */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}