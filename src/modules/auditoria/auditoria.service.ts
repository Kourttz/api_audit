import { HttpException, Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { paginate } from '../../common/utils/pagination.util'; 
import { IQueryParams } from '../../common/interfaces/query-params.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs/promises'; 
import { existsSync } from 'fs';   
import * as path from 'path';
import { InfluxDbService } from './influxdb.service';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);
  private readonly perfisFilePath = path.resolve(process.cwd(), 'perfis_cache.json');

  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
    private readonly http: HttpService,
    private readonly influxDbService: InfluxDbService
  ) {}

  /**
   * Metodo para obter ip do request, caso seja necessário registrar o IP do usuário que realizou a ação auditada.
   * @param request - Objeto da requisição HTTP, contendo as informações do cliente, como headers e conexão
   * @return string - O endereço IP do cliente, extraído dos headers ou da conexão
   */
  obterIp(request: any): string {
    return (
      request?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      request?.socket?.remoteAddress ||
      request?.ip ||
      'N/A'
    );
  }

  /**
   * Persiste um novo log de auditoria via requisição direta (POST)
   * Útil para integrações manuais ou sistemas que não utilizam o Interceptor Kafka.
   * @param dados - Objeto contendo os dados da auditoria (DTO)
   * @returns O log de auditoria persistido
   */
  async create(dados: any): Promise<Auditoria> {
    try {
      // Envia para o InfluxDB de forma assíncrona
      this.influxDbService.writeLog(dados);

      // Não salva no Postgres se for apenas VISUALIZAR
      if (dados.tpAcao === 'VISUALIZAR') {
        return {} as Auditoria;
      }

      const log = this.auditoriaRepository.create({
        noSistema: dados.noSistema,
        noFuncionalidade: dados.noFuncionalidade,
        noPerfil: dados.noPerfil,
        tpAcao: dados.tpAcao,
        txEndpoint: dados.txEndpoint,
        nuStatusCode: dados.nuStatusCode,
        coUsuario: dados.coUsuario,
        coMatricula: dados.coMatricula,
        noIp: dados.noIp,
        vlDadosEnviados: dados.vlDadosEnviados,
        vlDadosRecebidos: dados.vlDadosRecebidos,
      });

      const salvo = await this.auditoriaRepository.save(log);
      this.logger.log(`✅ Registro de auditoria criado manualmente: ID ${salvo.coAuditoria}`);
      return salvo;
    } catch (error) {
      this.logger.error('❌ Erro ao criar registro de auditoria:', error.message);
      throw new HttpException(
        'Erro ao processar o registro de auditoria.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recebe o payload do Kafka (enviado pelo Interceptor) e persiste no Postgres
   * O payload deve conter os campos necessários para criar um log de auditoria, como:
   *  {
   *    "no_sistema": "admin",
   *    "no_funcionalidade": "gestao-perfis",
   *    "no_perfil": "Desenvolvedor",
   *    "tx_endpoint": "/api/gestao",
   *    "tp_metodo": "POST",
   *    "tp_acao": "CREATE",
   *    "nu_status_code": 201,
   *    "co_usuario": 1,
   *    "co_matricula": "129891",
   *    "no_usuario": "João Silva",
   *    "no_ip": "192.168.1.1",
   *    "vl_dados_enviados": { "nome": "Novo Perfil" },
   *    "vl_dados_recebidos": { "id": 10, "nome": "Novo Perfil" },
   *    "dt_evento": "2023-10-27T14:30:00Z"
   *  }
   * @param payload - Objeto contendo os dados do log de auditoria a ser salvo
   * @return void
   */
  async salvarLog(payload: any): Promise<void> {
    try {
      // Envia para o InfluxDB de forma assíncrona
      this.influxDbService.writeLog(payload);

      // Não salva no Postgres se for apenas VISUALIZAR
      if (payload.tp_acao === 'VISUALIZAR') {
         return;
      }

      const novoLog = this.auditoriaRepository.create({
        noSistema: payload.no_sistema,
        noFuncionalidade: payload.no_funcionalidade,
        noPerfil: payload.no_perfil,
        tpAcao: payload.tp_acao,
        txEndpoint: payload.tx_endpoint,
        nuStatusCode: payload.nu_status_code,
        coUsuario: payload.co_usuario,
        coMatricula: payload.co_matricula,
        noIp: payload.no_ip,
        vlDadosEnviados: payload.vl_dados_enviados, 
        vlDadosRecebidos: payload.vl_dados_recebidos,
      });

      await this.auditoriaRepository.save(novoLog);
      this.logger.log(`✅ Log de auditoria gravado: ${payload.tp_acao} ${payload.tx_endpoint}`);
    } catch (error) {
      this.logger.error('❌ Erro ao persistir log no banco:', error.message);
    }
  }

  /**
 * Lista todos os sistemas distintos cadastrados na auditoria
 * Realiza uma consulta no banco para obter os nomes dos sistemas que possuem registros de auditoria, retornando uma lista ordenada.
 * @return string[] - Lista de nomes dos sistemas distintos encontrados nos registros de auditoria
 */
  async listarSistemas(): Promise<string[]> {
    try {
      const sistemas = await this.auditoriaRepository
        .createQueryBuilder('auditoria')
        .select('DISTINCT auditoria.noSistema', 'noSistema')
        .where('auditoria.noSistema IS NOT NULL')
        .orderBy('auditoria.noSistema', 'ASC')
        .getRawMany();

      return sistemas.map(item => item.noSistema);
    } catch (error) {
      this.logger.error(
        '❌ Erro ao listar sistemas da auditoria:',
        error.message,
      );

      throw new HttpException(
        'Erro ao listar sistemas da auditoria.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Método de consulta utilizando a estrutura de paginação e busca global
   * Permite buscar logs de auditoria com filtros e ordenação, retornando os resultados paginados.
   * @param query - Objeto contendo os parâmetros de consulta, como page, limit, search e filters
   * @return Objeto paginado contendo os logs de auditoria que correspondem aos critérios de busca e filtros aplicados
   */
  async buscarLogs(query: IQueryParams, user?: any) {
    const searchFields = ['noSistema', 'noFuncionalidade', 'coMatricula', 'txEndpoint', 'tpAcao'];

    const resultado = await paginate<Auditoria>(
      this.auditoriaRepository,
      query,
      { 
        relationLoadStrategy: 'query',
        relations: ['usuario'],
        order: { dhRegistro: 'DESC' }, 
      },
      searchFields,
    );

    if (user) {
      // Extrai o token do objeto user (preenchido pelo JwtStrategy)
      const token = user.token || null;
      this.registrarConsulta(user, query, token).catch(err => 
        this.logger.error('Erro ao registrar log da consulta:', err.message)
      );
    }

    return resultado;
  }

  /**
   * Registra o LOG da propria consulta de auditoria, para fins de rastreabilidade e monitoramento das consultas realizadas.
   * O log é gravado de forma assíncrona para não impactar a performance da resposta.
   * @param user - Objeto contendo as informações do usuário que realizou a consulta, como coUsuario, coMatricula, noPerfil e ip
   * @param query - Objeto contendo os parâmetros de consulta utilizados na busca dos logs de auditoria, como page, limit, search e filters
   * @return void
   */
  async registrarConsulta(user: any, query: IQueryParams, token?: string): Promise<void> {
    // 1. Throttle (5 minutos)
    const ultimoRegistro = await this.auditoriaRepository.findOne({
      where: {
        coUsuario: user.coUsuario,
        txEndpoint: '/auditoria',
        tpAcao: 'VISUALIZAR',
      },
      order: { dhRegistro: 'DESC' },
    });

    if (ultimoRegistro) {
      const agora = new Date();
      const diferencaMinutos = (agora.getTime() - ultimoRegistro.dhRegistro.getTime()) / (1000 * 60);
      if (diferencaMinutos < 5) return;
    }

    // 2. Lógica de Cache Semanal
    let nomePerfilFinal: string | null = null;
    const coPerfil = user.coPerfil;
    let cacheData = { updatedAt: new Date(0).toISOString(), perfis: {} };

    try {
      if (existsSync(this.perfisFilePath)) {
        const fileContent = await fs.readFile(this.perfisFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);

        const ultimaAtualizacao = new Date(parsed.updatedAt || 0);
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

        if (ultimaAtualizacao > umaSemanaAtras) {
          cacheData = parsed;
        } else {
          this.logger.log('📅 Cache de perfis expirado (7 dias). Atualizando...');
        }
      }

      if (cacheData.perfis[coPerfil]) {
        nomePerfilFinal = cacheData.perfis[coPerfil];
      } else {
        const url = `http://api_gestao:8080/perfis/${coPerfil}`;
        
        if (!token) {
          this.logger.warn(`⚠️ Tentativa de busca de perfil ${coPerfil} sem token.`);
        }

        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const { data: apiResponse } = await firstValueFrom(this.http.get(url, config));

        // Ajuste para aceitar tanto noPerfil quanto no_perfil
        nomePerfilFinal = apiResponse?.data?.noPerfil || apiResponse?.data?.no_perfil;

        if (nomePerfilFinal) {
          cacheData.perfis[coPerfil] = nomePerfilFinal;
          cacheData.updatedAt = new Date().toISOString(); 

          await fs.writeFile(
            this.perfisFilePath, 
            JSON.stringify(cacheData, null, 2), 
            'utf-8'
          );
        }
      }
    } catch (error) {
      this.logger.warn(`⚠️ Falha ao obter perfil da Gestão (Status: ${error.response?.status || 'Error'}): ${error.message}`);
    }

    // Fallback caso a API falhe ou retorne erro (ex: 401)
    if (!nomePerfilFinal) {
      nomePerfilFinal = `Perfil ${coPerfil}`;
    }

    // 3. Persistência
    await this.salvarLog({
      no_sistema: 'Auditoria',
      no_funcionalidade: 'Logs',
      no_perfil: nomePerfilFinal,
      tp_acao: 'VISUALIZAR',
      tx_endpoint: '/auditoria',
      nu_status_code: 200,
      co_usuario: user.coUsuario,
      co_matricula: user.coMatricula,
      no_ip: this.obterIp(user.request),
      vl_dados_enviados: query,
      vl_dados_recebidos: { page: query.page, limit: query.limit },
    });
  }
}