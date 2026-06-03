import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Decodifica e valida um token JWT.
   * * Remove o prefixo 'Bearer ' se presente.
   * * Verifica a assinatura e a validade temporal do token.
   *
   * @param token - O token JWT (com ou sem prefixo).
   * @returns O payload decodificado do token.
   * @throws ForbiddenException Se o token estiver expirado, inválido ou malformado.
   */
  async decodeToken(token: string): Promise<any> {
    try {
      const tokenValue = token.startsWith('Bearer ')
        ? token.split(' ')[1]
        : token;
      const decoded = await this.jwtService.verifyAsync(tokenValue);
      if (decoded.exp * 1000 < Date.now()) {
        throw new ForbiddenException('Token expirado.');
      }
      return decoded;
    } catch (error) {
      throw new ForbiddenException('Token inválido ou expirado.');
    }
  }

  /**
   * Extrai a matrícula do utilizador a partir de um token JWT.
   * * Utiliza o método `decodeToken` para validar e decodificar o token primeiro.
   *
   * @param token - O token JWT.
   * @returns O número da matrícula contido no payload.
   */
  async extractMatricula(token: string): Promise<number> {
    const decoded = await this.decodeToken(token);
    return decoded.matricula;
  }
}
