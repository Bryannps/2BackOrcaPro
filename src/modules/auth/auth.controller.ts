/**
 * Controller de Autenticação
 * Endpoints para login, registro e informações do usuário
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { JwtAuthGuard, LocalAuthGuard } from './guards/auth.guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registro de nova empresa
   * POST /api/auth/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<{
    success: boolean;
    message: string;
    data: AuthResponseDto;
  }> {
    const result = await this.authService.register(registerDto);
    
    return {
      success: true,
      message: 'Empresa registrada com sucesso',
      data: result,
    };
  }

  /**
   * Login de empresa
   * POST /api/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<{
    success: boolean;
    message: string;
    data: AuthResponseDto;
  }> {
    const result = await this.authService.login(loginDto);
    
    return {
      success: true,
      message: 'Login realizado com sucesso',
      data: result,
    };
  }

  /**
   * Informações do usuário logado
   * GET /api/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return {
      success: true,
      message: 'Dados do usuário obtidos com sucesso',
      data: {
        user: req.user,
      },
    };
  }

  /**
   * Validar token
   * POST /api/auth/validate-token
   */
  @Post('validate-token')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return {
      success: true,
      message: 'Token válido',
      data: {
        valid: true,
        user: req.user,
      },
    };
  }

  /**
   * Refresh token (futuro)
   * POST /api/auth/refresh
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    // TODO: Implementar refresh token
    return {
      success: true,
      message: 'Token atualizado com sucesso',
      data: {
        token: 'new-token-here', // Placeholder
        expires_in: '7d',
      },
    };
  }
}