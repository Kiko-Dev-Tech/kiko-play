import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'node:crypto';

interface AdminTokenPayload {
  role: 'admin';
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async login(password: string): Promise<string> {
    const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? '');
    const given = Buffer.from(password);
    if (
      expected.length === 0 ||
      expected.length !== given.length ||
      !timingSafeEqual(expected, given)
    ) {
      throw new UnauthorizedException('Wrong admin password');
    }
    return this.jwt.signAsync({ role: 'admin' } satisfies AdminTokenPayload);
  }

  async isAdminToken(token: string | undefined): Promise<boolean> {
    if (!token) {
      return false;
    }
    try {
      const payload = await this.jwt.verifyAsync<AdminTokenPayload>(token);
      return payload.role === 'admin';
    } catch {
      return false;
    }
  }
}
