import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn  } from 'typeorm';
import { Usuarios } from '../usuarios/usuarios.entity';

@Entity({ name: 'tb_auditoria' })
export class Auditoria {
  @PrimaryGeneratedColumn({ name: 'co_auditoria' })
  coAuditoria: number;

  @Column({ name: 'no_sistema', type: 'varchar', length: 255 })
  noSistema: string;

  @Column({ name: 'no_funcionalidade', type: 'varchar', length: 255 })
  noFuncionalidade: string;

  @Column({ name: 'no_perfil', type: 'varchar', length: 255, nullable: true })
  noPerfil: string;

  @Column({ name: 'tp_acao', type: 'varchar', length: 50 })
  tpAcao: string; 

  @Column({ name: 'tx_endpoint', type: 'varchar', length: 255 })
  txEndpoint: string;

  @Column({ name: 'nu_status_code', type: 'int' })
  nuStatusCode: number;

  @Column({ name: 'co_usuario', type: 'int', nullable: true })
  coUsuario: number;

  @ManyToOne(() => Usuarios)
  @JoinColumn({ name: 'co_usuario' })
  usuario: Usuarios;

  @Column({ name: 'co_matricula', type: 'varchar', length: 50, nullable: true })
  coMatricula: string;

  @Column({ name: 'no_ip', type: 'varchar', length: 45, nullable: true })
  noIp: string;

  @Column({ name: 'vl_dados_enviados', type: 'jsonb', nullable: true })
  vlDadosEnviados: any;

  @Column({ name: 'vl_dados_recebidos', type: 'jsonb', nullable: true })
  vlDadosRecebidos: any;

  @Column({
    name: 'dh_registro',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dhRegistro: Date;
}