export interface ConnectorConfig {
  connectorName: string;
  schema: string;      // ex: 'public' ou outro schema
  table: string;       // ex: 'tb_usuarios'
  topicPrefix: string; // ex: 'gestao-usuarios'
}
