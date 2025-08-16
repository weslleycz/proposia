import { Injectable, Inject } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaService } from 'src/common/services/prisma.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createClientDto: CreateClientDto) {
    const client = await this.prisma.client.create({ data: createClientDto });
    await this.cacheManager.del('all_clients');
    return client;
  }

  @CacheTTL(300) // 5 minutes
  @CacheKey('all_clients')
  async findAll() {
    const clients = await this.prisma.client.findMany();
    return clients;
  }

  @CacheTTL(300) // 5 minutes
  @CacheKey('client_')
  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    const client = await this.prisma.client.update({ where: { id }, data: updateClientDto });
    await this.cacheManager.del('all_clients');
    await this.cacheManager.del(`client_${id}`);
    return client;
  }

  async remove(id: string) {
    const client = await this.prisma.client.delete({ where: { id } });
    await this.cacheManager.del('all_clients');
    await this.cacheManager.del(`client_${id}`);
    return client;
  }
}
