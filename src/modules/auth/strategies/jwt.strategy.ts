/**
 * JWT Strategy para Passport
 * Valida tokens JWT nas requisições autenticadas
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'super-secret-jwt-key-for-development'),
    });
  }

  /**
   * Valida o payload do JWT e retorna os dados do usuário
   */
  async validate(payload: JwtPayload) {
    const company = await this.authService.findCompanyById(payload.sub);
    
    if (!company) {
      throw new UnauthorizedException('Token inválido - empresa não encontrada');
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