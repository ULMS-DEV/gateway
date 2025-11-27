import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { GrpcToHttpInterceptor } from 'nestjs-grpc-exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalInterceptors(new GrpcToHttpInterceptor());
  const cfg = app.get(ConfigService);
  await app.listen(cfg.get<number>('PORT') ?? 3000);
}
bootstrap();
