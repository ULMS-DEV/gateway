import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { RequirePerms } from 'src/decorators/permissions.decorator';
import { AuthRolesGuard } from 'src/guards/auth/auth-roles.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { PERMS } from 'ulms-contracts';

@UseGuards(AuthGuard, AuthRolesGuard)
@Controller('test')
export class TestController {

    @Get()
    auth(@CurrentUser() user: any){
        return user;
    }

    @RequirePerms(PERMS.USER_READ)
    @Get('test')
    roles(@CurrentUser() user: any){
        return user;
    }
}
