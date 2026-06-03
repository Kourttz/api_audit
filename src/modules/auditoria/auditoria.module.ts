import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Auditoria } from './auditoria.entity';
import { AuthModule } from '../../common/auth/auth.module';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';
import { TokenModule } from '../../common/token/token.module';

@Module({
  imports: [TypeOrmModule.forFeature([Auditoria]), forwardRef(() => AuthModule), TokenModule, HttpModule],
  controllers: [AuditoriaController], // Adicione aqui
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
