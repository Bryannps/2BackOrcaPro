/**
 * Configuração principal da aplicação NestJS
 * Define todas as configurações globais e middleware
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Prefixo global para todas as rotas da API
  app.setGlobalPrefix('api');

  // Pipe de validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas nos DTOs
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
      transform: true, // Transforma automaticamente os tipos
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Inicia o servidor
  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📚 API disponível em http://localhost:${port}/api`);
}

bootstrap();