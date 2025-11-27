import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BullModule } from '@nestjs/bull';
import { AuthController } from './auth/auth.controller';
import { TestController } from './test/test.controller';
import { PermissionsService } from './permissions/permissions.service';
import { CoursesController } from './courses/courses.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from './config/multer.config';
import { ProctorController } from './proctor/proctor.controller';
import { ProctorService } from './proctor/proctor.service';
import { AssignmentsController } from './assignments/assignments.controller';
import { ExamsController } from './exams/exams.controller';
import { ProctoringGateway } from './exams/proctoring.gateway';
import { ProctoringProcessor } from './exams/proctoring.processor';
import { AssistantController } from './assistant/assistant.controller';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    MulterModule.register(multerConfig),
    BullModule.registerQueue({
      name: 'proctoring',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
      },
    }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_GRPC',
        imports: [ConfigModule],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: require.resolve('ulms-contracts/protos/auth.proto'),
            url: cfg.get<string>('AUTH_GRPC_URL') ?? '0.0.0.0:50051',
            loader: {
              longs: String,
              enums: String,
              defaults: false,
              objects: true,
              arrays: true
            }
          }
        }),
        inject: [ConfigService]
      },
      {
        name: 'USER_GRPC',
        imports: [ConfigModule],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'user',
            protoPath: require.resolve('ulms-contracts/protos/user.proto'),
            url: cfg.get<string>('USER_GRPC_URL') ?? '0.0.0.0:50052',
            loader: {
              longs: String,
              enums: String,
              defaults: false,
              objects: true,
              arrays: true
            }
          }
        }),
        inject: [ConfigService]
      },
      {
        name: 'COURSE_GRPC',
        imports: [ConfigModule],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'course',
            protoPath: require.resolve('ulms-contracts/protos/course.proto'),
            url: cfg.get<string>('COURSE_GRPC_URL') ?? '0.0.0.0:50052',
            loader: {
              longs: String,
              enums: String,
              defaults: false,
              objects: true,
              arrays: true
            }
          }
        }),
        inject: [ConfigService]
      },
      {
        name: 'ASSIGNMENT_GRPC',
        imports: [ConfigModule],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'assignment',
            protoPath: require.resolve('ulms-contracts/protos/assignment.proto'),
            url: cfg.get<string>('ASSIGNMENT_GRPC_URL') ?? '0.0.0.0:50054',
            loader: {
              longs: String,
              enums: String,
              defaults: false,
              objects: true,
              arrays: true
            }
          }
        }),
        inject: [ConfigService]
      },
      {
        name: 'PROCTOR_GRPC',
        imports: [ConfigModule],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'proctor',
            protoPath: require.resolve('ulms-contracts/protos/proctor.proto'),
            url: cfg.get<string>('PROCTOR_GRPC_URL') ?? '0.0.0.0:60051',
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: false,
              objects: true,
              arrays: true,
            }
          }
        }),
        inject: [ConfigService]
      },
      {
        name: 'ASSISTANT_GRPC',
        imports: [ConfigModule],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'assistant',
            protoPath: require.resolve('ulms-contracts/protos/assistant.proto'),
            url: cfg.get<string>('ASSISTANT_GRPC_URL') ?? '0.0.0.0:60052',
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: false,
              objects: true,
              arrays: true,
            }
          }
        }),
        inject: [ConfigService]
      },
      {
        name: 'EXAM_GRPC',
        imports: [ConfigModule],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'exam',
            protoPath: require.resolve('ulms-contracts/protos/exam.proto'),
            url: cfg.get<string>('EXAM_GRPC_URL') ?? '0.0.0.0:50055',
            loader: {
              longs: String,
              enums: String,
              defaults: false,
              objects: true,
              arrays: true
            }
          }
        }),
        inject: [ConfigService]
      },
    ]),
  ],
  providers: [PermissionsService, ProctorService, ProctoringGateway, ProctoringProcessor],
  controllers: [
    AuthController,
    TestController,
    CoursesController,
    ProctorController,
    AssignmentsController,
    ExamsController,
    AssistantController
  ],
})
export class AppModule {}
