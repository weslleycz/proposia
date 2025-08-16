import { CACHE_MANAGER, Cache, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services';
import { CreateClientDto } from './dto/create-client.dto';
import { FindClientsDto } from './dto/find-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

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

  // @CacheTTL(300) // 5 minutes
  // @CacheKey('all_clients')
  async findAll(query: FindClientsDto) {
    const { page = 1, pageSize = 10, name, email, phone, cnpjCpf, address } = query;

    const parsedPage = Number(page);
    const parsedPageSize = Number(pageSize);

    const where: any = {};
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }
    if (phone) {
      where.phone = { contains: phone, mode: 'insensitive' };
    }
    if (cnpjCpf) {
      where.cnpjCpf = { contains: cnpjCpf, mode: 'insensitive' };
    }
    if (address) {
      where.address = { contains: address, mode: 'insensitive' };
    }

    const skip = (parsedPage - 1) * parsedPageSize;
    const take = parsedPageSize;

    const [clients, total] = await this.prismaService.$transaction([
      this.clientRepository.findMany({
        where,
        skip,
        take,
      }),
      this.clientRepository.count({ where }),
    ]);

    return { clients, total, page, pageSize };
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