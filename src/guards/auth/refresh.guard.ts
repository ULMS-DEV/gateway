import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Metadata, status } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RefreshGuard implements CanActivate {
  private authService: any;
  constructor(@Inject('AUTH_GRPC') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService('AuthService');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'] as string;

    if (!authHeader) {
      throw new UnauthorizedException('missing token');
    }

    const metadata = new Metadata();
    metadata.add('authorization', authHeader);

    try {
      const result = await firstValueFrom(
        this.authService.refresh({}, metadata),
      ) as { ack: boolean; accessToken: string; refreshToken: string };

      if (!result.ack) {
        throw new UnauthorizedException('invalid token');
      }

      req.refresh = result;
      return true;
    } catch (err: any) {
      if (err?.code === status.UNAUTHENTICATED) {
        throw new UnauthorizedException(JSON.parse(err.details).error ?? 'invalid token');
      }
      throw err;
    }
  }
}
