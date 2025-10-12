import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth/auth.controller';
import { TestController } from './test/test.controller';
import { PermissionsService } from './permissions/permissions.service';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
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
      }
    ]),
  ],
  providers: [PermissionsService],
  controllers: [AuthController, TestController],
})
export class AppModule {}
