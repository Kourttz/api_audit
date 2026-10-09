import { Injectable, Logger } from '@nestjs/common';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

@Injectable()
export class InfluxDbService {
  private readonly logger = new Logger(InfluxDbService.name);
  private influxDB: InfluxDB;
  private writeApi: any;

  constructor() {
    // Estas configurações idealmente viriam do ConfigService (variaveis de ambiente)
    // Para simplificar a POC/implementação, usamos variáveis de ambiente direto
    const url = process.env.INFLUX_URL || 'http://api_auditoria_influxdb:8086'; // Nome do container docker do influx
    const token = process.env.INFLUX_TOKEN || 'my-super-secret-auth-token';
    const org = process.env.INFLUX_ORG || 'plansul';
    const bucket = process.env.INFLUX_BUCKET || 'monitoramento_acessos';

    this.influxDB = new InfluxDB({ url, token });
    this.writeApi = this.influxDB.getWriteApi(org, bucket, 'ns'); // ns = nano seconds
  }

  /**
   * Envia os dados de forma assíncrona para o InfluxDB
   * @param payload Dados da auditoria (do Controller ou Kafka)
   */
  writeLog(payload: any): void {
    try {
      const point = new Point('api_requests')
        .tag('sistema', payload.no_sistema || payload.noSistema || 'desconhecido')
        .tag('funcionalidade', payload.no_funcionalidade || payload.noFuncionalidade || 'geral')
        .tag('method', payload.tp_metodo || payload.tpMetodo || 'GET')
        .tag('acao', payload.tp_acao || payload.tpAcao || 'VISUALIZAR')
        .tag('status_code', String(payload.nu_status_code || payload.nuStatusCode || 200))
        .tag('ip', payload.no_ip || payload.noIp || 'desconhecido')
        .tag('co_matricula', String(payload.co_matricula || payload.coMatricula || 'desconhecido'))
        .intField('count', 1);

      this.writeApi.writePoint(point);
      
      // Flush é importante para forçar o envio imediato, embora o writeApi 
      // faça isso automaticamente em background. Para tempo real, é bom.
      this.writeApi.flush().catch((err: any) => {
          this.logger.error('Erro ao enviar dados para InfluxDB (flush):', err);
      });
      
    } catch (error) {
      this.logger.error('Erro ao montar point do InfluxDB:', error);
    }
  }
}
