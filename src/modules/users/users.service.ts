import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  BcryptService,
  PrismaService,
  SendMailService,
} from 'src/common/services';
import { CreateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bcryptService: BcryptService,
    private readonly sendMailService: SendMailService,
  ) {}

  private get userRepository() {
    return this.prismaService.user;
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, password } = createUserDto;

    const userExists = await this.userRepository.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const hashedPassword = await this.bcryptService.hashPassword(password);

    const user = await this.userRepository.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: Role.SALESPERSON,
      },
    });

    await this.sendMailService.send({
      to: user.email,
      subject: 'Bem-vindo',
      template: 'welcome.pug',
      parametros: {
        nome: user.name,
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.userRepository.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.userRepository.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado`);
    }

    return user;
  }
}
