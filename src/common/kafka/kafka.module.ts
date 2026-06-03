import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { AuditoriaModule } from '../../modules/auditoria/auditoria.module';
import { UsuariosModule } from '../../modules/usuarios/usuarios.module';

@Module({
  imports: [
    AuditoriaModule,
    UsuariosModule
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}