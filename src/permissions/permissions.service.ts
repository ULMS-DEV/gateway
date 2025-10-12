import { Inject, Injectable } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PermissionsService {
  private userService;

  constructor(@Inject('USER_GRPC') private client: ClientGrpc) {}

  onModuleInit(){
    this.userService = this.client.getService('UserService');
  }

  async getEffectivePermissions(userId: string): Promise<bigint> {
    const user: any = await firstValueFrom(this.userService.findOneById({id: userId}));
    if (!user || !user.isActive) return 0n;
    const roleMask = BigInt(user.role?.permsMask?.toString() ?? '0');
    const extra = BigInt(user.extraPermsMask.toString());
    return roleMask | extra;
  }
}
