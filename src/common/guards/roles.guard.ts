import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/common/services';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user?.userId) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const dbUser = await this.prismaService.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (!dbUser) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    const hasRole = requiredRoles.includes(dbUser.role);

    if (!hasRole) {
      throw new ForbiddenException('Usuário não possui permissão');
    }

    return true;
  }
}
