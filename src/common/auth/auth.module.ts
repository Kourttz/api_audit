import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt_strategy';
import { JwtAuthGuard } from './jwt_auth_guard';
import { TokenModule } from '../token/token.module';
import { UsuariosModule } from '../../modules/usuarios/usuarios.module';

@Module({
  imports: [PassportModule, TokenModule, forwardRef(() => UsuariosModule)],
  providers: [JwtAuthGuard, JwtStrategy],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
