import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from './admin.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        // Without JWT_SECRET the admin password signs tokens, so changing it invalidates old tokens.
        secret:
          process.env.JWT_SECRET || `kiko-${process.env.ADMIN_PASSWORD ?? ''}`,
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard],
  exports: [AuthService, AdminGuard],
})
export class AuthModule {}
