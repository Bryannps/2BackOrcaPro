/**
 * Módulo principal da aplicação
 * Configura todos os módulos, providers e configurações globais
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { getDatabaseConfig } from './config/database.config';
import { getConfig } from './config/validation.config';

// Módulos da aplicação
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { BudgetsModule } from './modules/budgets/budgets.module';

// Controllers principais
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuração global
    ConfigModule.forRoot({
      isGlobal: true,
      load: [getConfig],
      envFilePath: '.env',
    }),

    // Configuração do banco de dados
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Configuração JWT global
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'super-secret-jwt-key-for-development'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),

    // Passport para autenticação
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Módulos da aplicação
    AuthModule,
    CompaniesModule,
    TemplatesModule,
    BudgetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}