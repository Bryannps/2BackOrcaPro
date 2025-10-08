/**
 * DTOs para autenticação
 * Define estruturas de dados para login, registro e resposta
 */

import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @IsString({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}

export class RegisterDto {
  @IsString({ message: 'Nome da empresa é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Nome não pode exceder 255 caracteres' })
  name: string;

  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @IsString({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Documento não pode exceder 20 caracteres' })
  document?: string;
}

export class AuthResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
    document?: string;
    settings: Record<string, any>;
  };
  token: string;
  expires_in: string;
}