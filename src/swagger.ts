import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export default function initSwagger(app: INestApplication) {
  const apiPrefix = process.env.API_PREFIX || '';

  const config = new DocumentBuilder()
    .setTitle('API AUDITORIA')
    .setDescription('API responsável por registrar as auditorias dos microserviços')
    .setVersion('1.0')
    .addServer(apiPrefix)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);
}
