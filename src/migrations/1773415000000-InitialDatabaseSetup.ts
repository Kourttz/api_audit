import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialDatabaseSetup1773415000000 implements MigrationInterface {
    name = 'InitialDatabaseSetup1773415000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Criar Schema e Configurações de Banco
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "gestao"`);
        
        const dbName = queryRunner.connection.options.database;
        await queryRunner.query(`ALTER DATABASE "${dbName}" SET timezone TO 'America/Sao_Paulo'`);

        // 2. Criar Tabela de Usuários
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "gestao"."tb_usuarios" (
                "co_usuario" integer NOT NULL, 
                "no_name" character varying(255) NOT NULL, 
                "co_matricula" character varying(50) NOT NULL, 
                "no_email" character varying(255), 
                "ic_situacao_ativo" boolean NOT NULL DEFAULT true, 
                "nu_filial" character varying(50), 
                "co_perfil" integer NOT NULL, 
                "co_cpf" character varying(14), 
                "nu_tel" character varying(20),
                CONSTRAINT "UQ_99cbeb39926191641c268a2c021" UNIQUE ("co_matricula"), 
                CONSTRAINT "UQ_e3c706f3304bc948e266707b6b6" UNIQUE ("nu_filial"), 
                CONSTRAINT "UQ_a335a4c54cf1d9a286a4b4ccbd4" UNIQUE ("co_cpf"), 
                CONSTRAINT "PK_a5eea564110d74cddbab168d3e2" PRIMARY KEY ("co_usuario")
            )
        `);

        // 3. Criar Tabela de Auditoria (Já com a coluna dh_registro e tipo TIMESTAMPTZ)
        // Unifica a criação com a alteração desejada
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tb_auditoria" (
                "co_auditoria" SERIAL NOT NULL, 
                "no_sistema" character varying(255) NOT NULL, 
                "no_funcionalidade" character varying(255) NOT NULL, 
                "no_perfil" character varying(255), 
                "tp_acao" character varying(50) NOT NULL, 
                "tx_endpoint" character varying(255) NOT NULL, 
                "nu_status_code" integer NOT NULL, 
                "co_usuario" integer, 
                "co_matricula" character varying(50), 
                "no_ip" character varying(45), 
                "vl_dados_enviados" jsonb, 
                "vl_dados_recebidos" jsonb, 
                "dh_registro" TIMESTAMPTZ NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_auditoria" PRIMARY KEY ("co_auditoria")
            )
        `);

        // 4. Ajustes de sequences e constraints legadas
        await queryRunner.query(`ALTER TABLE "gestao"."tb_usuarios" ALTER COLUMN "co_usuario" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE IF EXISTS "gestao".tb_usuarios_co_usuario_seq CASCADE`);
        await queryRunner.query(`ALTER TABLE "gestao"."tb_usuarios" DROP CONSTRAINT IF EXISTS "UQ_3adeca8f81969b44f60fd48c47a"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "tb_auditoria"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "gestao"."tb_usuarios"`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS "gestao" CASCADE`);
    }
}