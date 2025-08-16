import { Injectable, Inject } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { PrismaService, SendMailService } from 'src/common/services';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private get clientRepository() {
    return this.prismaService.client;
  }

  async create(createClientDto: CreateClientDto) {
    const client = await this.clientRepository.create({
      data: createClientDto,
    });
    await this.cacheManager.del('all_clients');
    return client;
  }

  @CacheTTL(300) // 5 minutes
  @CacheKey('all_clients')
  async findAll() {
    const clients = await this.clientRepository.findMany();
    return clients;
  }

  @CacheTTL(300) // 5 minutes
  @CacheKey('client_')
  async findOne(id: string) {
    const client = await this.clientRepository.findUnique({ where: { id } });
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    const client = await this.clientRepository.update({
      where: { id },
      data: updateClientDto,
    });
    await this.cacheManager.del('all_clients');
    await this.cacheManager.del(`client_${id}`);
    return client;
  }

  async remove(id: string) {
    const client = await this.clientRepository.delete({ where: { id } });
    await this.cacheManager.del('all_clients');
    await this.cacheManager.del(`client_${id}`);
    return client;
  }
}
