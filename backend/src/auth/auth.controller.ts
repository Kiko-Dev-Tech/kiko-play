import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service.js';

class AdminLoginDto {
  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('admin')
  @HttpCode(200)
  async adminLogin(@Body() body: AdminLoginDto): Promise<{ token: string }> {
    return { token: await this.auth.login(body.password) };
  }
}
