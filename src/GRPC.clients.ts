// import { ConfigModule, ConfigService } from "@nestjs/config";
// import { Transport } from "@nestjs/microservices";

// export const GRPC_CLIENTS = [
//     {
//         name: 'AUTH_GRPC',
//         imports: [ConfigModule],
//         useFactory: (cfg: ConfigService) => ({
//             transport: Transport.GRPC,
//             options: {
//             package: 'auth',
//             protoPath: require.resolve('ulms-contracts/protos/auth.proto'),
//             url: cfg.get<string>('AUTH_GRPC_URL') ?? '0.0.0.0:50051',
//                 loader: {
//                     longs: String,
//                     enums: String,
//                     defaults: false,
//                     objects: true,
//                     arrays: true
//                 }
//             }
//         }),
//         inject: [ConfigService]
//     },
//     {
//         name: 'USER_GRPC',
//         imports: [ConfigModule],
//         useFactory: (cfg: ConfigService) => ({
//             transport: Transport.GRPC,
//             options: {
//             package: 'user',
//             protoPath: require.resolve('ulms-contracts/protos/user.proto'),
//             url: cfg.get<string>('USER_GRPC_URL') ?? '0.0.0.0:50052',
//                 loader: {
//                     longs: String,
//                     enums: String,
//                     defaults: false,
//                     objects: true,
//                     arrays: true
//                 }
//             }
//         }),
//         inject: [ConfigService]
//     },
//     {
//         name: 'COURSE_GRPC',
//         imports: [ConfigModule],
//         useFactory: (cfg: ConfigService) => ({
//             transport: Transport.GRPC,
//             options: {
//             package: 'course',
//             protoPath: require.resolve('ulms-contracts/protos/course.proto'),
//             url: cfg.get<string>('COURSE_GRPC_URL') ?? '0.0.0.0:50052',
//                 loader: {
//                     longs: String,
//                     enums: String,
//                     defaults: false,
//                     objects: true,
//                     arrays: true
//                 }
//             }
//         }),
//         inject: [ConfigService]
//     },
//     {
//         name: 'ASSIGNMENT_GRPC',
//         imports: [ConfigModule],
//         useFactory: (cfg: ConfigService) => ({
//             transport: Transport.GRPC,
//             options: {
//             package: 'assignment',
//             protoPath: require.resolve('ulms-contracts/protos/assignment.proto'),
//             url: cfg.get<string>('ASSIGNMENT_GRPC_URL') ?? '0.0.0.0:50054',
//                 loader: {
//                     longs: String,
//                     enums: String,
//                     defaults: false,
//                     objects: true,
//                     arrays: true
//                 }
//             }
//         }),
//         inject: [ConfigService]
//     },
// ]