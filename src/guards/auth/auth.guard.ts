import { Metadata, status } from '@grpc/grpc-js';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { fromTimestamp } from 'src/common/util/googleTimestamp.util';

@Injectable()
export class AuthGuard implements CanActivate {
  private authService;
  constructor(@Inject('AUTH_GRPC') private client: ClientGrpc){}
  onModuleInit(){
    this.authService = this.client.getService('AuthService');
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers["authorization"] as string;

    if(!authHeader) throw new UnauthorizedException('missing token');

    const metadata = new Metadata();
    metadata.add('authorization', authHeader);

    try {
      const result = await firstValueFrom(this.authService.authorize({}, metadata)) as { valid: boolean, user: any };
      if (!result.valid) throw new UnauthorizedException('invalid token');
      req.user = {
        ...result.user,
        createdAt: fromTimestamp(result.user.createdAt),
        updatedAt: fromTimestamp(result.user.updatedAt),
      };
      return true;
    } catch (err: any) {
      if (err?.code === status.UNAUTHENTICATED) {
        throw new UnauthorizedException(JSON.parse(err.details).error ?? 'invalid token');
      }
      throw err;
    }
  }
}
