import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { AuthModule } from './common/auth/auth.module';
import { TokenModule } from './common/token/token.module';
import { KafkaModule } from './common/kafka/kafka.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      synchronize: false,
      logging: false,
      entities: [__dirname + '/**/*.entity{.js,.ts}'],
      migrations: [__dirname + '/migrations/*{.js,.ts}']
    }),
    AuthModule,
    TokenModule,
    KafkaModule,
    AuditoriaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
