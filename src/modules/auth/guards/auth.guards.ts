/**
 * Guards para autenticação
 * Protegem rotas que requerem autenticação
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT - protege rotas que precisam de token válido
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * Guard Local - usado para login com email/senha
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}