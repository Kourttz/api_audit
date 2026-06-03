import {
  Controller,
  Get,
  UseFilters,
  HttpStatus,
  Req,
  Param,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { Usuarios } from './usuarios.entity';
import { ResponseDto } from '../../common/filters/response.dto';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { getGMT3Timestamp } from '../../common/utils/timestamp.util';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@ApiBearerAuth('access-token')
@ApiTags('Usuarios')
@UseFilters(HttpExceptionFilter)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os Usuários' })
  async listar(@Req() request:Request): Promise<ResponseDto<Usuarios[]>> {
    const usuarios = await this.usuariosService.listarUsuarios();
    return {
      statusCode: HttpStatus.OK,
      message: 'Usuários listados com sucesso',
      timestamp: getGMT3Timestamp(),
      path: request.url,
      data: usuarios
    };
  }

  @Get(':coUsuario')
  @ApiOperation({ summary: 'Obtém um Usuário por ID' })
  async obterPorId(@Req() request: Request, @Param('coUsuario') id: number): Promise<ResponseDto<Usuarios>> {
    const usuario = await this.usuariosService.obterUsuarioPorId(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Usuário obtido com sucesso',
      timestamp: getGMT3Timestamp(),
      path: request.url,
      data: usuario,
    };
  }

}
