import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const payload = {
      name: 'superadmin',
      username: 'superadmin@gmail.com',
    };

    return {
      token: this.jwtService.signAsync(payload),
    };
  }
}
