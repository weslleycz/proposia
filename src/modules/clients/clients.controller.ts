import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FindClientsDto } from './dto/find-clients.dto';
import { ClientEntity } from './entities/client.entity';
import { JwtAuthGuard } from 'src/common/guards';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo cliente' })
  @ApiResponse({
    status: 201,
    description: 'O cliente foi criado com sucesso.',
    type: ClientEntity,
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os clientes com filtros e paginação' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filtra clientes pelo nome' })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Filtra clientes pelo email' })
  @ApiQuery({ name: 'phone', required: false, type: String, description: 'Filtra clientes pelo telefone' })
  @ApiQuery({ name: 'cnpjCpf', required: false, type: String, description: 'Filtra clientes pelo CNPJ/CPF' })
  @ApiQuery({ name: 'address', required: false, type: String, description: 'Filtra clientes pelo endereço' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Quantidade de itens por página (padrão: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes retornada com sucesso.',
    schema: {
      properties: {
        clients: { type: 'array', items: { $ref: '#/components/schemas/ClientEntity' } },
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
      },
    },
  })
  findAll(@Query() query: FindClientsDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um cliente pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Cliente retornado com sucesso.',
    type: ClientEntity,
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um cliente pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Cliente atualizado com sucesso.',
    type: ClientEntity,
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um cliente pelo ID' })
  @ApiResponse({ status: 204, description: 'Cliente removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
