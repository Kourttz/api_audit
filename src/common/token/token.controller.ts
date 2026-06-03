import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('decode')
  async decode(@Body('token') token: string) {
    if (!token) {
      throw new HttpException('O token é obrigatório', HttpStatus.BAD_REQUEST);
    }
    return this.tokenService.decodeToken(token);
  }
}
