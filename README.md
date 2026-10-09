# 🕵️‍♂️ API de Auditoria — NestJS + TypeScript + Kafka + PostgreSQL

A **API de Auditoria** é um microserviço responsável por **centralizar o registro de eventos e ações** executadas em outros sistemas da plataforma.  
Seu objetivo é garantir **rastreabilidade**, **segurança** e **transparência** de todas as operações realizadas, como criação, atualização, exclusão e acesso de dados.

Desenvolvida com **NestJS**, **Kafka** e **PostgreSQL**, esta aplicação foi projetada para operar em ambientes distribuídos, com **alta escalabilidade** e **processamento assíncrono** de mensagens.

---

## 🚀 Tecnologias Utilizadas

- **NestJS** — Framework Node.js progressivo e modular  
- **TypeScript** — Tipagem estática e segurança no desenvolvimento  
- **Kafka** — Sistema de mensageria distribuído e escalável  
- **PostgreSQL** — Banco de dados relacional para armazenamento persistente
- **Docker** — Containerização dos serviços  
- **Swagger** — Documentação interativa da API  
- **Passport/JWT** — Proteção de rotas de consulta para usuários autenticados
- **Class Validator / Transformer** — Validação e transformação de dados de entrada  

---

## 📁 Estrutura de Pastas

```bash
api_auditoria/
├── src/
│   ├── modules/
│   │   ├── auditoria/
│   │   │   ├── dto/                # DTOs de filtro e busca
│   │   │   ├── auditoria.controller.ts # Consulta de logs
│   │   │   ├── auditoria.service.ts    # Persistência e lógica
│   │   │   └── auditoria.entity.ts     # Mapeamento tb_auditoria
│   │   └── usuarios/            # Integração com base de usuários
│   ├── common/
│   │   ├── auth/                # Guard e Strategy JWT
│   │   ├── decorators/          # Decoradores de paginação e usuário
│   │   ├── kafka/               # Configuração do Consumer Kafka
│   │   └── utils/               # Utilitários de paginação e timestamp
│   ├── app.module.ts          # Módulo principal
│   └── main.ts                # Inicialização da aplicação
├── .env                     # Variáveis de ambiente
├── package.json
└── README.md    
```

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- **Node.js v22.14.0** (ou superior)  
- **npm v10.8.2** (ou compatível)  
- **Docker + Docker Compose**  
- **Kafka + Zookeeper**  
- **PostgreSQL v14+**

---

## 📦 Instalação e Execução

1. **Clone o repositório**

```bash
git clone http://172.32.1.71/gitlab/workforce/api_auditoria.git
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure o arquivo `.env`**

```env
PORT=3005

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=auditoria
DB_USERNAME=postgres
DB_PASSWORD=suasenha

# Kafka
KAFKA_BROKER=localhost:9092
KAFKA_TOPIC=topic_auditoria_geral

# Segurança
JWT_SECRET=seu_segredo_jwt
```

4. **Inicie o servidor em modo desenvolvimento**

```bash
npm run start:dev
```

---

## 🐳 Execução com Docker

```bash
docker-compose up -d
```

## 🏗️ Build para Produção

```bash
npm run build
npm run start:prod
```

---

## 📖 Documentação da API

```
http://localhost:3005/docs
```

---

## 📖 Funcionalidades Principais

1. Ingestão Automática (Kafka)
   A API consome mensagens do tópico topic_auditoria_geral e as persiste automaticamente no PostgreSQL através do AuditoriaService.

2. Consulta Paginada e Busca Global
   Possui endpoint de consulta (GET /auditoria/logs) com suporte a:
  - Busca Global: Pesquisa por termo em múltiplos campos (ILIKE) via parâmetro search.
  - Filtros Dinâmicos: Filtragem por sistema, matrícula, ação ou data.
  - Paginação: Controle de page e limit com metadados de resposta (total, lastPage).
  - Ordenação: Suporte a ordenação dinâmica (ex: order[dhRegistro]=DESC).


🧠 Exemplo de Payload de Auditoria (Kafka)
```json
{
  "no_sistema": "Recrutamento",
  "no_funcionalidade": "vagas",
  "no_perfil": "Desenvolvedor",
  "tp_acao": "CADASTRAR",
  "tx_endpoint": "/vagas",
  "nu_status_code": 201,
  "co_matricula": "129891",
  "no_ip": "127.0.0.1",
  "vl_dados_enviados": { "titulo": "Dev NestJS" },
  "vl_dados_recebidos": { "id": 1, "status": "sucesso" }
}
```

📄 Documentação: Central de Auditoria
Esta API centraliza todos os logs de ações e eventos do ecossistema. Ela aceita dados por duas vias:

   - HTTP (REST): Para integrações síncronas ou via Gateway (Kong).

   - Kafka (Event-Driven): Para integrações assíncronas entre microserviços.

1. Configuração de Ambiente (.env)
As APIs que desejam se integrar devem configurar as seguintes variáveis:

```bash
# Se for integrar via HTTP (AuditoriaClient)
URL_API_AUDITORIA=http://api_auditoria:8080/auditoria

# Se for integrar via Kafka
KAFKA_BROKERS=kafka:29092
TOPIC_AUDITORIA=auditoria_acoes_topic
```


## ✍️ Autor

Desenvolvido por **Renato Vinicius** como parte da suíte de microserviços corporativos, com o objetivo de fornecer **auditoria distribuída**, **observabilidade de eventos** e **rastreabilidade de ações** em sistemas interconectados.
