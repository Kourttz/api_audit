import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import initSwagger from './swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  initSwagger(app);

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  await app.listen(port, '0.0.0.0'); 
  console.log(`API rodando na porta ${port}`);
}
bootstrap();
