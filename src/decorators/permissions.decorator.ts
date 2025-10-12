import { SetMetadata } from '@nestjs/common';
export const PERMS_KEY = 'perms_required';
export type PermMode = 'all' | 'any';
export type PermMeta = { mask: bigint; mode?: PermMode };
export const RequirePerms = (mask: bigint, mode: PermMode = 'all') =>
  SetMetadata(PERMS_KEY, { mask, mode } as PermMeta);
