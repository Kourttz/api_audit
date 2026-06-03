import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { getGMT3Timestamp } from '../utils/timestamp.util';

/**
 * Filtro global para capturar exceções HTTP e formatar a resposta de erro.
 * Retorna um JSON com statusCode, timestamp, path e message.
 * Também captura exceções não tratadas e retorna um erro 500.
 * Exemplo de resposta de erro:
 * {
 *   "statusCode": 404,
 *   "timestamp": "2024-06-01T15:30:00-03:00",
 *   "path": "/api/exemplo",
 *  "message": "Recurso não encontrado"
 * }
 *  
 * @author 129891 - Renato Vinicius
 * @date setembro 2025
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseObj = exception.getResponse();
      message =
        typeof responseObj === 'string'
          ? responseObj
          : (responseObj as any).message || 'Erro desconhecido';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Erro interno do servidor';
      console.error('Unhandled exception:', exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: getGMT3Timestamp(),
      path: request.url,
      message,
    });
  }
}
