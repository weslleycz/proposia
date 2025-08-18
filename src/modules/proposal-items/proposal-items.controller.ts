import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateProposalItemDto, UpdateProposalItemDto } from './dto';
import { ProposalItem } from './entities';
import { ProposalItemsService } from './proposal-items.service';

@ApiTags('proposal-items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proposals/:proposalId/items')
export class ProposalItemsController {
  constructor(
    private readonly proposalItemsService: ProposalItemsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar um novo item a uma proposta' })
  @ApiCreatedResponse({ description: 'Item criado com sucesso.', type: ProposalItem })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(
    @Param('proposalId') proposalId: string,
    @Body() createProposalItemDto: CreateProposalItemDto,
  ) {
    
    return this.proposalItemsService.create(proposalId, createProposalItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os itens de uma proposta' })
  @ApiOkResponse({ description: 'Itens retornados com sucesso.', type: [ProposalItem] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll(@Param('proposalId') proposalId: string) {
    return this.proposalItemsService.findAll(proposalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um item específico por ID' })
  @ApiOkResponse({ description: 'Item encontrado.', type: ProposalItem })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(
    @Param('proposalId') proposalId: string,
    @Param('id') id: string,
  ) {
    return this.proposalItemsService.findOne(proposalId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um item de uma proposta' })
  @ApiOkResponse({ description: 'Item atualizado com sucesso.', type: ProposalItem })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('proposalId') proposalId: string,
    @Param('id') id: string,
    @Body() updateProposalItemDto: UpdateProposalItemDto,
  ) {
    return this.proposalItemsService.update(proposalId, id, updateProposalItemDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover um item de uma proposta' })
  @ApiResponse({ status: 204, description: 'Item removido com sucesso (sem conteúdo).' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(
    @Param('proposalId') proposalId: string,
    @Param('id') id: string,
  ) {
    await this.proposalItemsService.remove(proposalId, id);
  }
}
