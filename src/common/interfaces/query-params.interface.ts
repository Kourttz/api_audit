/**
 * Interface para os parâmetros de consulta (query params) usados em endpoints de listagem.
 * - page: Número da página (padrão: 1)
 * - limit: Quantidade de itens por página (padrão: 10)
 * - search: Termo de busca genérico para filtrar resultados
 * - searchFields: Lista de campos/colunas onde o termo de busca deve ser aplicado (ex: ['noVaga', 'deVaga'])
 * - Observação: O campo 'search' é um termo de busca global que pode ser aplicado a múltiplos campos definidos em 'searchFields'. Isso permite uma busca flexível e eficiente, onde o usuário pode digitar um termo e o sistema irá procurar por esse termo em todas as colunas especificadas.
 * - Exemplo de Uso:
 *    GET /vagas?search=desenvolvedor&searchFields=noVaga,noProjeto
 *    GET /candidaturas?search=joão&searchFields=noCandidato,coVaga
 * 
 * @author 129891 - Renato Vinicius
 * @date fevereiro 2026
 */
export interface IQueryParams {
  page?: number;            // Número da página
  limit?: number;           // Itens por página
  search?: string;          // Termo de busca global
  searchFields?: string[];  // Campos onde a busca deve ser aplicada
  [key: string]: any;       // Permite capturar filtros dinâmicos como coUnidade, noStatus, etc.
}