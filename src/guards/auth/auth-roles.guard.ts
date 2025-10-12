import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermMeta, PERMS_KEY } from 'src/decorators/permissions.decorator';
import { PermissionsService } from 'src/permissions/permissions.service';
import { hasAll, hasAny } from 'ulms-contracts';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private perms: PermissionsService){}

  async canActivate(
    ctx: ExecutionContext,
  ): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<PermMeta>(PERMS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!meta) return true;

    try {
      const req = ctx.switchToHttp().getRequest();
      const user = req.user;
      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      const effective = await this.perms.getEffectivePermissions(user.id);
      const hasPermission = meta.mode === 'any'
        ? hasAny(effective, meta.mask)
        : hasAll(effective, meta.mask);

      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    } catch (error) {
      if(error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Permission check failed');
    }
  }
}
