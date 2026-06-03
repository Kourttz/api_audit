import { DataSource } from "typeorm";
import { Usuarios } from "../modules/usuarios/usuarios.entity";

export async function seedUsuarios(dataSource: DataSource) {
  const repo = dataSource.getRepository(Usuarios);

  const total = await repo.count();
  if (total > 0) {
    console.log("Seed Usuários ignorado: registros já existem.");
    return;
  }

  const usuariosData = [
    { 
      coUsuario: 1,
      noName: "Renato Silva", 
      coMatricula: "129891",
      noEmail: "rSilva@email.com",
      icSituacaoAtivo: true,
      coPerfil: 2, 
      coCpf: "11111111111",
      nuTel: "71992365478"
    }
  ];

  // Criando as instâncias
  const usuarios = repo.create(usuariosData);

  await repo.save(usuarios);

  console.log(`✅ Seed Usuários executado com sucesso (${usuarios.length} registros).`);
}