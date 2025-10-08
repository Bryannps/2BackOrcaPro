/**
 * Configuração principal do banco de dados PostgreSQL
 * Utiliza TypeORM para ORM e gerenciamento de migrations
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: parseInt(configService.get('DB_PORT', '5432')),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'password'),
  database: configService.get('DB_DATABASE', 'orcapro'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: configService.get('NODE_ENV') !== 'production',
  logging: configService.get('NODE_ENV') !== 'production',
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsRun: true,
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});

// Configuração para CLI do TypeORM
const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'fernanda@10',
  database: process.env.DB_DATABASE || 'orcapro',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
};

export default new DataSource(dataSourceOptions);