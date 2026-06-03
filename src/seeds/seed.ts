import { DataSource } from "typeorm";
import { seedUsuarios } from "./usuarios.seed";
import { AppDataSource } from "../../data_source";

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log("📦 Conexão com banco estabelecida!");

    // await seedUsuarios(AppDataSource);

    console.log("✅ Seeds concluídos!");
    process.exit(0);
  } catch (err) {
    console.error("Erro ao executar seeds:", err);
    process.exit(1);
  }
}

runSeeds();
