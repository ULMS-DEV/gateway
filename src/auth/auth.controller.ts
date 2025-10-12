import { Body, Controller, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { RefreshGuard } from 'src/guards/auth/refresh.guard';

@Controller('auth')
export class AuthController {
  private authService;

  constructor(@Inject('AUTH_GRPC') private client: ClientGrpc){}

  onModuleInit(){
    this.authService = this.client.getService('AuthService');
  }

  @Post('login')
  login(@Body() data: {email: string, password: string}){
    return this.authService.login(data);
  }

  @UseGuards(RefreshGuard)
  @Post('refresh')
  refresh(@Req() req: any) {
    return req.refresh;
  }

  @Post('signup')
  signup(@Body() data: {name: string, email: string, password: string}){
    return this.authService.signup(data);
  }

  @HttpCode(200)
  @Post('verify/:id')
  verifyUser(@Body() {otp}: {otp: string}, @Param() {id}: {id: string}){
    return this.authService.verifyUser({userId: id, otp});
  }

  @Post('resend-otp/:id')
  resendOtp(@Param() {id}: {id: string}){
    return this.authService.resendOtp({userId: id});
  }
}