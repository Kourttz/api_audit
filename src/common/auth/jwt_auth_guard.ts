import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticação JWT global.
 * * Verifica se a requisição possui um token JWT válido no cabeçalho Authorization.
 * * Estende o comportamento padrão do Passport Strategy 'jwt'.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
