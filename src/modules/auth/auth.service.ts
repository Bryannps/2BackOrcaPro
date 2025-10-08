/**
 * Service de Autenticação
 * Lógica de negócio para login, registro e validação de usuários
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { Company } from '../companies/entities/company.entity';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registra uma nova empresa no sistema
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { name, email, password, document } = registerDto;

    // Verificar se email já existe
    const existingCompany = await this.companyRepository.findOne({
      where: { email },
    });

    if (existingCompany) {
      throw new ConflictException('Email já está sendo utilizado por outra empresa');
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar nova empresa
    const company = this.companyRepository.create({
      name,
      email,
      document,
      settings: {
        password: hashedPassword, // Guardamos a senha no settings por enquanto
        currency: 'BRL',
        tax_rate: 0.18,
        profit_margin: 0.30,
        created_at: new Date().toISOString(),
      },
    });

    const savedCompany = await this.companyRepository.save(company);

    // Gerar token JWT
    const token = this.generateJwtToken(savedCompany);

    return this.buildAuthResponse(savedCompany, token);
  }

  /**
   * Faz login de uma empresa
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Buscar empresa por email
    const company = await this.companyRepository.findOne({
      where: { email },
    });

    if (!company) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(
      password,
      company.settings?.password || '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar token JWT
    const token = this.generateJwtToken(company);

    return this.buildAuthResponse(company, token);
  }

  /**
   * Valida um usuário (usado pelo Passport Local Strategy)
   */
  async validateUser(email: string, password: string): Promise<Company | null> {
    const company = await this.companyRepository.findOne({
      where: { email },
    });

    if (company && company.settings?.password) {
      const isPasswordValid = await bcrypt.compare(password, company.settings.password);
      if (isPasswordValid) {
        return company;
      }
    }

    return null;
  }

  /**
   * Busca uma empresa pelo ID (usado pelo JWT Strategy)
   */
  async findCompanyById(id: string): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { id },
    });
  }

  /**
   * Gera token JWT para uma empresa
   */
  private generateJwtToken(company: Company): string {
    const payload = {
      sub: company.id,
      email: company.email,
      name: company.name,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Constrói a resposta de autenticação
   */
  private buildAuthResponse(company: Company, token: string): AuthResponseDto {
    return {
      user: {
        id: company.id,
        name: company.name,
        email: company.email,
        document: company.document,
        settings: {
          currency: company.settings?.currency || 'BRL',
          tax_rate: company.settings?.tax_rate || 0.18,
          profit_margin: company.settings?.profit_margin || 0.30,
        },
      },
      token,
      expires_in: this.configService.get('JWT_EXPIRES_IN', '7d'),
    };
  }

  /**
   * Valida se um token JWT é válido
   */
  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      const company = await this.findCompanyById(decoded.sub);
      
      if (!company) {
        throw new UnauthorizedException('Token inválido');
      }

      return {
        id: company.id,
        email: company.email,
        name: company.name,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}