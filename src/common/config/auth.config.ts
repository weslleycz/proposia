import { ConfigService } from '@nestjs/config';

export const getAuthConfig = (configService: ConfigService) => ({
  jwtSecret: configService.get<string>('SECURITY_JWT', ''),
  jwtRefreshSecret: configService.get<string>('SECURITY_JWT_REFRESH', ''),
  jwtExpiration: configService.get<string>('JWT_EXPIRATION', '1h'),
  jwtRefreshExpiration: configService.get<string>(
    'JWT_REFRESH_EXPIRATION',
    '7d',
  ),
  jwtPasswordResetSecret: configService.get<string>(
    'SECURITY_JWT_PASSWORD_RESET',
    '',
  ),
  jwtPasswordResetExpiration: configService.get<string>(
    'JWT_PASSWORD_RESET_EXPIRATION',
    '15m',
  ),
});
