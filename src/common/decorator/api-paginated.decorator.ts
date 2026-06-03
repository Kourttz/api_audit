import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

interface PaginatedOptions {
  searchDesc?: string;
  filters?: { name: string; description: string; type?: any }[];
  orderExample?: string;
}

/**
 * Decorator para adicionar parâmetros de paginação e filtros dinâmicos.
 * @author 129891 - Renato Vinicius
 * @date fevereiro 2026
 */
export function ApiPaginatedResponse(options?: PaginatedOptions) {
  const decorators = [
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número da página (padrão: 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Itens por página (padrão: 10)',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: options?.searchDesc || 'Termo de busca global',
    }),

    ApiQuery({
      name: 'order',
      required: false,
      style: 'deepObject',
      explode: true,
      schema: {
        type: 'object',
        additionalProperties: {
          type: 'string',
          enum: ['ASC', 'DESC'],
        },
        example: {
          coVaga: 'DESC',
          dtCriadoEm: 'ASC',
        },
      },
      description:
        options?.orderExample ||
        'Ordenação dinâmica. Exemplo: order[coVaga]=DESC',
    }),
  ];

  // Adiciona filtros extras se forem passados
  if (options?.filters) {
    options.filters.forEach((filter) => {
      decorators.push(
        ApiQuery({
          name: filter.name,
          required: false,
          type: filter.type || String,
          description: filter.description,
        }),
      );
    });
  }

  return applyDecorators(...decorators);
}