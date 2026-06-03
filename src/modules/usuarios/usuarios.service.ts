import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuarios } from './usuarios.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectRepository(Usuarios)
    private readonly UsuariosRepository: Repository<Usuarios>,
    private readonly http: HttpService,
  ) {}

  async listarUsuarios(): Promise<Usuarios[]> {
    return this.UsuariosRepository.find();
  }

  /**
   * Busca usuário por matrícula com fallback para a API de Gestão
   * @param matricula Matrícula do usuário
   * @param token Token JWT para repassar na requisição (opcional)
   */
  async findByMatricula(matricula: string, token?: string): Promise<Usuarios | null> {
    // 1. Busca no banco local (Auditoria)
    let usuario = await this.UsuariosRepository.findOneBy({ coMatricula: matricula });

    // 2. Se não achou localmente, busca na API de Gestão
    if (!usuario) {
      try {
        const url = `http://api_gestao:8080/usuarios/matricula/${matricula}`;
        
        // Monta os headers de autenticação, se o token foi fornecido
        const config = token ? {
          headers: { Authorization: `Bearer ${token}` }
        } : {};

        // Faz a requisição enviando o config
        const { data: apiResponse } = await firstValueFrom(this.http.get(url, config));
        
        // 3. Verifica se a API retornou o usuário dentro da propriedade 'data'
        if (apiResponse && apiResponse.data) {

          const externo = apiResponse.data;
          
          // Mapeia de snake_case para camelCase 
          usuario = this.UsuariosRepository.create({
            coUsuario: externo.coUsuario,
            noName: externo.noName,
            coMatricula: externo.coMatricula,
            nuTel: externo.nuTel,
            noEmail: externo.noEmail,
            icSituacaoAtivo: externo.icSituacaoAtivo,
            coCpf: externo.coCpf,
            coPerfil: externo.coPerfil
          });

          await this.UsuariosRepository.save(usuario);
          this.logger.log(`✅ Usuário ${matricula} recuperado com sucesso da API Gestão.`);
        }
      } catch (error) {
        // Loga o erro real vindo da Gestão
        this.logger.error(`❌ Erro no fallback Gestão (Matrícula: ${matricula}): ${error.response?.data?.message || error.message}`);
        return null;
      }
    }

    return usuario || null;
  }

  async obterUsuarioPorId(id: number): Promise<Usuarios> {
    const usuario = await this.UsuariosRepository.findOneBy({ coUsuario: id });
    if (!usuario) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }
    return usuario;
  }

  /* FUNÇÕES DIRECIONADAS AO KAFKA */

  async create(data: any): Promise<void> {
    await this.UsuariosRepository.save(data);
    this.logger.log(`🆕 Usuário criado via Kafka: ${data.coUsuario}`);
  }

  async update(id: number, data: any): Promise<void> {
    await this.UsuariosRepository.update(id, data);
    this.logger.log(`✏️ Usuário atualizado via Kafka: ${id}`);
  }

  async delete(id: number): Promise<void> {
    await this.UsuariosRepository.delete({ coUsuario: id });
    this.logger.log(`🗑️ Usuário deletado via Kafka: ${id}`);
  }
}