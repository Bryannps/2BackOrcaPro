/**
 * Local Strategy para Passport
 * Valida credenciais de login (email e senha)
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Usar email ao invés de username
      passwordField: 'password',
    });
  }

  /**
   * Valida as credenciais do usuário
   */
  async validate(email: string, password: string): Promise<any> {
    const company = await this.authService.validateUser(email, password);
    
    if (!company) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      id: company.id,
      email: company.email,
      name: company.name,
      document: company.document,
      settings: company.settings,
    };
  }
}