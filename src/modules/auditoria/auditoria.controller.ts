import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseFilters,
  HttpStatus,
  Req,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../../common/auth/jwt_auth_guard';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { ResponseDto } from '../../common/filters/response.dto';
import { getGMT3Timestamp } from '../../common/utils/timestamp.util';
import { CreateAuditoriaDto, FiltroAuditoriaDto} from './auditoria.dto';
import { ApiPaginatedResponse } from '../../common/decorator/api-paginated.decorator';
import type { IQueryParams } from '../../common/interfaces/query-params.interface';

@ApiBearerAuth('access-token')
@ApiTags('Auditoria')
@UseGuards(JwtAuthGuard)
@UseFilters(HttpExceptionFilter)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta os logs de auditoria com paginação e busca' })
  @ApiPaginatedResponse({
    searchDesc: 'Busca em sistema, funcionalidade, matrícula, endpoint ou ação',
    filters: [
      { name: 'noSistema', description: 'Filtrar por nome do sistema' },
      { name: 'tpAcao', description: 'Filtrar por tipo de ação' },
      { name: 'nuStatusCode', description: 'Filtrar por status code' },
    ],
  })
  async listarLogs(
    @Req() request: any, 
    @Query() query: IQueryParams & FiltroAuditoriaDto,
  ): Promise<ResponseDto<any>> {
    
    // 1. Extrai o token do Header para repassar à API de Gestão
    const authHeader = request.headers.authorization;
    const token = authHeader?.split(' ')[1];

    // 2. Monta o contexto do usuário com o Token e o objeto Request
    const userComRequest = {
      ...request.user,
      token: token, 
      request: request 
    };
    
    const resultado = await this.auditoriaService.buscarLogs(query, userComRequest);

    return {
      statusCode: HttpStatus.OK,
      message: 'Logs de auditoria recuperados com sucesso',
      timestamp: getGMT3Timestamp(),
      path: request.url,
      data: resultado,
    };
  }

  @Get('/sistemas')
  @ApiOperation({ summary: 'Lista todos os sistemas distintos da auditoria' })
  async listarSistemas(
    @Req() request: any,
  ): Promise<ResponseDto<string[]>> {

    const sistemas = await this.auditoriaService.listarSistemas();

    return {
      statusCode: HttpStatus.OK,
      message: 'Sistemas recuperados com sucesso',
      timestamp: getGMT3Timestamp(),
      path: request.url,
      data: sistemas,
    };
  }
  
  @Post()
  @ApiOperation({ summary: 'Registra um novo log de auditoria' })
  async criarLog(
    @Body() dados: CreateAuditoriaDto,
    @Req() request: any,
  ): Promise<ResponseDto<any>> {
    const novoLog = await this.auditoriaService.create(dados);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Log de auditoria registrado com sucesso',
      timestamp: getGMT3Timestamp(),
      path: request.url,
      data: novoLog,
    };
  }
}