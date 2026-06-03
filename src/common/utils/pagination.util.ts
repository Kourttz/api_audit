/**
 * Função de Paginação Genérica para TypeORM
 *
 * Recursos suportados:
 * - Filtros dinâmicos automáticos
 * - Busca global utilizando ILIKE (case-insensitive)
 * - Ordenação dinâmica
 * - Relacionamentos (relations)
 * - Paginação completa
 * - Filtros por data
 * - Filtros por ARRAY utilizando operador IN (...)
 *
 * Regras automáticas de filtros:
 * - Campos iniciados com "dt":
 *   tratados como data e filtrados pelo intervalo completo do dia
 *
 * - Campos iniciados com:
 *   "co" (código)
 *   "ic" (indicador)
 *   "nu" (numérico)
 *   utilizam igualdade exata (=)
 *
 * - Arrays:
 *   automaticamente convertidos para:
 *   IN (:...campo)
 *
 * - Demais campos:
 *   utilizam ILIKE com busca parcial
 *
 * ------------------------------------------------------------
 * Exemplo de Uso:
 * ------------------------------------------------------------
 *
 * const resultado = await paginate(
 *   this.vagasRepository,
 *   query,
 *   {
 *     relations: ['funcao', 'nivel'],
 *     order: { coVaga: 'ASC' },
 *   },
 *   [
 *     'noVaga',
 *     'deVaga',
 *     'funcao.noFuncao',
 *     'nivel.noNivel',
 *   ],
 * );
 *
 * ------------------------------------------------------------
 * O resultado retornará:
 * ------------------------------------------------------------
 *
 * {
 *   data: [...],
 *   meta: {
 *     total,
 *     page,
 *     lastPage,
 *     limit
 *   }
 * }
 *
 * ------------------------------------------------------------
 * Exemplos de Filtros:
 * ------------------------------------------------------------
 *
 * Filtro de Data:
 * GET /vagas?dtCriacao=2024-02-15
 *
 * Busca Global:
 * GET /vagas?search=desenvolvedor
 *
 * Ordenação:
 * GET /vagas?order[coVaga]=DESC
 *
 * Filtro Simples:
 * GET /vagas?coEmpresa=1
 *
 * Filtro com Array:
 * GET /auditoria?noSistema=RH&noSistema=Financeiro
 *
 * Resultado SQL:
 * WHERE no_sistema IN ('RH', 'Financeiro')
 *
 * ------------------------------------------------------------
 * Exemplo Completo:
 * ------------------------------------------------------------
 *
 * GET /vagas?
 *   search=desenvolvedor&
 *   dtCriacao=2024-02-15&
 *   order[coVaga]=DESC&
 *   page=2&
 *   limit=5
 *
 * @author 129891 - Renato Vinicius
 * @date fevereiro 2026
 */
import { Repository, ObjectLiteral, Brackets } from 'typeorm';
import { IQueryParams } from '../interfaces/query-params.interface';

export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  query: IQueryParams,
  baseOptions: any = {},
  searchFields: string[] = [],
) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const queryBuilder = repository.createQueryBuilder('entity');

  const dynamicOrder: Record<string, 'ASC' | 'DESC'> = {};
  const filters: Record<string, any> = {};

  let search: string | undefined;

  /**
   * Separação dos parâmetros
   */
  Object.keys(query).forEach((key) => {

    const value = query[key];

    if (key === 'search') {
      search = value as string;
      return;
    }

    if (key === 'page' || key === 'limit') {
      return;
    }

    const orderMatch = key.match(/^order\[(.+)\]$/);

    if (orderMatch) {

      const column = orderMatch[1];

      dynamicOrder[column] =
        String(value).toUpperCase() === 'ASC'
          ? 'ASC'
          : 'DESC';

    } else {

      filters[key] = value;

    }

  });

  /**
   * 1. Aplicar Relações
   */
  if (baseOptions.relations) {

    baseOptions.relations.forEach((rel: string) => {

      const parts = rel.split('.');

      if (parts.length === 1) {

        queryBuilder.leftJoinAndSelect(
          `entity.${rel}`,
          rel,
        );

      } else {

        const alias = rel.replace(/\./g, '_');

        const parentAlias =
          parts.slice(0, -1).join('_') || 'entity';

        const property = parts[parts.length - 1];

        queryBuilder.leftJoinAndSelect(
          `${parentAlias}.${property}`,
          alias,
        );

      }

    });

  }

  /**
   * 2. Filtros Dinâmicos
   */
  Object.keys(filters).forEach((key) => {

    const value = filters[key];

    const hasValue =
      value !== undefined &&
      value !== null &&
      (
        Array.isArray(value)
          ? value.length > 0
          : String(value).trim() !== ''
      );

    if (!hasValue) {
      return;
    }

   /**
   * Filtros especiais de período
   */
    if (
      key === 'dtInicio' &&
      /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ) {

      const startDate =
        new Date(`${value}T00:00:00.000Z`);

      queryBuilder.andWhere(
        `entity.dhRegistro >= :dtInicio`,
        {
          dtInicio: startDate,
        },
      );

      return;
    }

    if (
      key === 'dtFim' &&
      /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ) {

      const endDate =
        new Date(`${value}T23:59:59.999Z`);

      queryBuilder.andWhere(
        `entity.dhRegistro <= :dtFim`,
        {
          dtFim: endDate,
        },
      );

      return;
    }

  /**
   * Filtro de DATA padrão
   */
    if (
      key.startsWith('dt') &&
      !Array.isArray(value) &&
      /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ) {

      const columnExists =
        repository.metadata.findColumnWithPropertyName(
          key,
        );

      if (!columnExists) {
        return;
      }

      const dateStr = String(value);

      const startDate =
        new Date(`${dateStr}T00:00:00.000Z`);

      const endDate =
        new Date(`${dateStr}T23:59:59.999Z`);

      queryBuilder.andWhere(
        `
          entity.${key} >= :start_${key}
          AND
          entity.${key} <= :end_${key}
        `,
        {
          [`start_${key}`]: startDate,
          [`end_${key}`]: endDate,
        },
      );

      return;
    }

    /**
     * Filtro ARRAY => IN (...)
     */
    if (Array.isArray(value)) {

      queryBuilder.andWhere(
        `entity.${key} IN (:...${key})`,
        {
          [key]: value,
        },
      );

      return;
    }

    /**
     * Campos de igualdade exata
     * co = código
     * ic = indicador
     */
    if (
      key.startsWith('co') ||
      key.startsWith('ic') ||
      key.startsWith('nu')
    ) {

      queryBuilder.andWhere(
        `entity.${key} = :${key}`,
        {
          [key]: value,
        },
      );

      return;
    }

    /**
     * Fallback padrão => ILIKE
     * JSON/JSONB => CAST AS TEXT
     */
    const column =
    repository.metadata.findColumnWithPropertyName(
      key,
    );

    const isJson =
    column?.type === 'json' ||
    column?.type === 'jsonb';

    if (isJson) {

      queryBuilder.andWhere(
        `CAST(entity.${key} AS TEXT) ILIKE :${key}`,
        {
          [key]: `%${value}%`,
        },
      );

    } else {

      queryBuilder.andWhere(
        `entity.${key} ILIKE :${key}`,
        {
          [key]: `%${value}%`,
        },
      );

    }
  });

  /**
   * 3. Busca Global (ILIKE)
   */
  if (
    search &&
    String(search).trim() !== '' &&
    searchFields.length > 0
  ) {

    queryBuilder.andWhere(
      new Brackets((qb) => {

        searchFields.forEach((field, index) => {

          const parts = field.split('.');

          let alias = 'entity';
          let column = parts[0];

          if (parts.length > 1) {

            alias = parts
              .slice(0, -1)
              .join('_');

            column = parts[parts.length - 1];

          }

          const condition = `${alias}.${column}`;

          const operator =
            index === 0
              ? 'where'
              : 'orWhere';

          qb[operator](
            `${condition} ILIKE :searchTerm`,
            {
              searchTerm: `%${search}%`,
            },
          );

        });

      }),
    );

  }

  /**
   * 4. Ordenação
   */
  if (Object.keys(dynamicOrder).length > 0) {

    Object.keys(dynamicOrder).forEach((key) => {

      const direction = dynamicOrder[key];

      const parts = key.split('.');

      let alias = 'entity';
      let column = parts[0];

      if (parts.length > 1) {

        alias = parts
          .slice(0, -1)
          .join('_');

        column = parts[parts.length - 1];

        const aliasExists =
          queryBuilder.expressionMap.aliases.some(
            (a) => a.name === alias,
          );

        if (!aliasExists) {
          return;
        }

        queryBuilder.addOrderBy(
          `${alias}.${column}`,
          direction,
        );

      } else {

        const columnExists =
          repository.metadata.findColumnWithPropertyName(
            column,
          );

        if (!columnExists) {
          return;
        }

        queryBuilder.addOrderBy(
          `entity.${column}`,
          direction,
        );

      }

    });

  } else if (baseOptions.order) {

    Object.keys(baseOptions.order).forEach((key) => {

      const columnExists =
        repository.metadata.findColumnWithPropertyName(
          key,
        );

      if (!columnExists) {
        return;
      }

      queryBuilder.addOrderBy(
        `entity.${key}`,
        baseOptions.order[key],
      );

    });

  }

  /**
   * 5. Paginação
   */
  const [data, total] = await queryBuilder
    .take(limit)
    .skip(skip)
    .getManyAndCount();

  return {
    data,
    meta: {
      total,
      page,
      lastPage: Math.ceil(total / limit),
      limit,
    },
  };
}