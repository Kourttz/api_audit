import { MigrationInterface, QueryRunner } from "typeorm";

export class AjusteFinoAuditoria1774382774690 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
     
        const hasOldColumn = await queryRunner.hasColumn("tb_auditoria", "dh_criacao");
        if (hasOldColumn) {
            await queryRunner.query(`ALTER TABLE "tb_auditoria" RENAME COLUMN "dh_criacao" TO "dh_registro"`);
        }

       
        await queryRunner.query(`
            ALTER TABLE "tb_auditoria" 
            ALTER COLUMN "dh_registro" TYPE TIMESTAMPTZ 
            USING "dh_registro"::timestamptz
        `);

        await queryRunner.query(`ALTER TABLE "tb_auditoria" ALTER COLUMN "dh_registro" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "tb_auditoria" RENAME COLUMN "dh_registro" TO "dh_criacao"`);
    }
}