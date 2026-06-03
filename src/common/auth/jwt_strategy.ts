import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Usuarios } from '../../modules/usuarios/usuarios.entity';
import { UsuariosService } from '../../modules/usuarios/usuarios.service';
import { TokenService } from '../token/token.service';
import { Request } from 'express'; // Importe o Request do express

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usuariosService: UsuariosService,
  ) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('Segredo JWT (JWT_SECRET) não encontrado.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true, // <-- ADICIONE ISSO AQUI: Permite acessar o request no validate
    });
  }

  // O primeiro parâmetro agora é o Request
  async validate(req: Request, payload: any): Promise<Usuarios> {
    if (!payload || !payload.registration) {
      throw new UnauthorizedException('Payload do token inválido.');
    }

    // Extrai o token do Header para repassar à API de Gestão
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Pega apenas a string do token

    const matricula = String(payload.registration);

    // 2. Agora passamos a matrícula E o token para o service
    const user = await this.usuariosService.findByMatricula(matricula, token);

    if (!user || user.icSituacaoAtivo === false) {
      throw new UnauthorizedException('Token inválido ou usuário desativado.');
    }

    return user;
  }
}