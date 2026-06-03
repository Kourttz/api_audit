import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Auditoria } from '../auditoria/auditoria.entity';

@Entity('gestao.tb_usuarios')
export class Usuarios {

  @PrimaryColumn({ name: 'co_usuario' })
  coUsuario: number;

  @Column({ name: 'no_name' })
  noName: string;

  @Column({ name: 'co_matricula' })
  coMatricula: string;

  @Column({ name: 'nu_tel', nullable: true })
  nuTel: string;

  @Column({ name: 'no_email', nullable: true })
  noEmail: string;

  @Column({ name: 'ic_situacao_ativo', default: true })
  icSituacaoAtivo: boolean;

  @Column({ name: 'co_cpf', nullable: true })
  coCpf: string;

  @Column({ name: 'co_perfil' })
  coPerfil: number;

  // ========== RELAÇÃO ADICIONADA ==========
  @OneToMany(() => Auditoria, (auditoria) => auditoria.usuario)
  auditorias: Auditoria[];
  
}