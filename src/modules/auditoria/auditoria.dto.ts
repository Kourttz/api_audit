import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject, IsNotEmpty, IsNumberString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltroAuditoriaDto {
  @ApiPropertyOptional({
    description: 'Lista de sistemas',
    example: ['Recrutamento', 'Financeiro'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : [value]
  )
  noSistema?: string[];

  @ApiPropertyOptional({ description: 'Funcionalidade acessada', example: 'vagas' })
  @IsOptional()
  @IsString()
  noFuncionalidade?: string;

  @ApiPropertyOptional({ description: 'Matrícula do usuário', example: '129891' })
  @IsOptional()
  @IsString()
  coMatricula?: string;

  @ApiPropertyOptional({ description: 'Tipo de ação realizada', example: 'CADASTRAR' })
  @IsOptional()
  @IsString()
  tpAcao?: string;

  @ApiPropertyOptional({ description: 'Código do usuário', example: '1' })
  @IsOptional()
  @IsNumberString()
  coUsuario?: number;
}

export class CreateAuditoriaDto {
  @ApiProperty({ example: 'api-gestao' })
  @IsString()
  @IsNotEmpty()
  noSistema: string;

  @ApiProperty({ example: 'auditoria' })
  @IsString()
  @IsNotEmpty()
  noFuncionalidade: string;

  @ApiPropertyOptional({ example: 'Administrador' })
  @IsOptional()
  @IsString()
  noPerfil?: string;

  @ApiProperty({ example: 'CONSULTAR' })
  @IsString()
  @IsNotEmpty()
  tpAcao: string;

  @ApiProperty({ example: '/auditoria/logs' })
  @IsString()
  @IsNotEmpty()
  txEndpoint: string;

  @ApiProperty({ example: 200 })
  @IsNumber()
  nuStatusCode: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  coUsuario?: number;

  @ApiProperty({ example: '129891' })
  @IsString()
  @IsNotEmpty()
  coMatricula: string;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  @IsOptional()
  @IsString()
  noIp?: string;

  @IsOptional()
  @IsObject()
  vlDadosEnviados?: any;

  @IsOptional()
  @IsObject()
  vlDadosRecebidos?: any;
}