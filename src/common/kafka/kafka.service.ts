import { Kafka, Consumer } from 'kafkajs';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { AuditoriaService } from '../../modules/auditoria/auditoria.service';
import { UsuariosService } from '../../modules/usuarios/usuarios.service';
import { createDebeziumConnector } from './utils/kafka.connector';
import { ConnectorConfig } from './utils/connector.interface';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    private readonly auditoriaService: AuditoriaService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async onModuleInit() {
    // 1. Configuração do Kafka
    const kafka = new Kafka({
      clientId: 'api-auditoria',
      brokers: ['kafka:29092'],
    });

    this.consumer = kafka.consumer({ groupId: 'auditoria-group-v2' });
    await this.consumer.connect();

    // ==================================================================
    // 2. INSCRIÇÃO NOS TÓPICOS
    // ==================================================================
    const topics = [
      'auditoria_acoes_topic',  // Logs manuais via Interceptor
      'gestao_usuario_topic',  // Sincronia de tabela via Debezium
    ];

    await this.consumer.subscribe({ topics: topics, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        try {
          const event = JSON.parse(message.value.toString());

          // ==================================================================
          // 3. ROTEAMENTO E TRATAMENTO DE EVENTOS (PADRÃO RECRUTAMENTO)
          // ==================================================================
          switch (topic) {
            
            // --- GESTÃO: USUÁRIOS (Sincronização de Tabela) ---
            case 'gestao_usuario_topic':
              const payloadCDC = event?.payload;
              if (!payloadCDC) return;

              await this.tratarEvento(
                this.usuariosService,
                payloadCDC.before,
                payloadCDC.after,
                payloadCDC.op,
                'co_usuario',
                this.mapearUsuario,
              );
              break;

            // --- AUDITORIA: AÇÕES (Logs de Sistema) ---
            case 'auditoria_acoes_topic':
              // Este tópico recebe o objeto direto do interceptor
              await this.auditoriaService.salvarLog(event);
              break;

            default:
              this.logger.warn(`⚠️ Tópico não tratado no switch: ${topic}`);
              break;
          }
        } catch (err) {
          this.logger.error(`❌ Erro ao processar mensagem do tópico ${topic}:`, err);
        }
      },
    });

    this.logger.log('📥 Consumidor de Auditoria conectado e ouvindo...');

    // Exemplo de criação do conector:
    // await this.criarConnector({
    //   connectorName: 'conn-auditoria-usuarios',
    //   table: 'tb_usuarios',
    //   schema: 'public',
    //   topicPrefix: 'gestao'
    // });
  }

  // ==================================================================
  // 4. FUNÇÃO GENÉRICA DE TRATAMENTO (PADRÃO RECRUTAMENTO)
  // ==================================================================
  private async tratarEvento(
    service: any,
    before: any,
    after: any,
    op: string,
    idField: string,
    mapFn: (data: any) => any,
  ) {
    const mappedData = after ? mapFn(after) : null;

    try {
      switch (op) {
        case 'c': // Create
        case 'r': // Read (Snapshot)
          if (!after?.[idField]) return;
          this.logger.log(`🟢 [${service.constructor.name}] Criando registro (${idField}: ${after[idField]})`);
          if (service.create) await service.create(mappedData);
          break;

        case 'u': // Update
          if (!after?.[idField]) return;
          this.logger.log(`🟡 [${service.constructor.name}] Atualizando registro (${idField}: ${after[idField]})`);
          if (service.update) await service.update(after[idField], mappedData);
          break;

        case 'd': // Delete
          if (!before?.[idField]) return;
          this.logger.log(`🔴 [${service.constructor.name}] Deletando registro (${idField}: ${before[idField]})`);
          if (service.delete) await service.delete(before[idField]);
          break;
      }
    } catch (error) {
      this.logger.error(`❌ Erro no serviço ${service.constructor.name} (Op: ${op}):`, error.message);
    }
  }

  // ==================================================================
  // 5. MAPEADORES DE DADOS
  // ==================================================================
  private mapearUsuario(data: any) {
    return {
      coUsuario: data.co_usuario,
      noName: data.no_name,
      coMatricula: data.co_matricula,
      noEmail: data.no_email,
      icSituacaoAtivo: data.ic_situacao_ativo ?? true,
      coPerfil: data.co_perfil,
    };
  }

  // ==================================================================
  // 6. FUNÇÃO DE CONECTOR (PADRONIZADA COM RECRUTAMENTO)
  // ==================================================================
  async criarConnector(config: ConnectorConfig) {
    return await createDebeziumConnector(config);
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
  }
}