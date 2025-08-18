import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { getAuthConfig } from '../../../common/config/auth.config';
import { JwtPayload } from 'src/common/interfaces';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    const authConfig = getAuthConfig(configService);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig.jwtRefreshSecret,
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<{ userId: string; email: string }> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
