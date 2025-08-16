import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { FindProposalsDto } from './dto/find-proposals.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { RequestWithUser } from 'src/common/interfaces';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('propostas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Criar uma nova proposta' })
  @ApiResponse({ status: 201, description: 'A proposta foi criada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiBody({ type: CreateProposalDto })
  create(@Body() createProposalDto: CreateProposalDto, @Req() req: RequestWithUser) {
    return this.proposalsService.create(createProposalDto, req.user.userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Obter todas as propostas' })
  @ApiResponse({ status: 200, description: 'Retorna todas as propostas.' })
  @ApiQuery({ type: FindProposalsDto })
  findAll(@Query() query: FindProposalsDto) {
    return this.proposalsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Obter uma proposta por ID' })
  @ApiResponse({ status: 200, description: 'Retorna uma única proposta.' })
  @ApiResponse({ status: 404, description: 'Proposta não encontrada.' })
  @ApiParam({ name: 'id', description: 'ID da proposta a ser recuperada' })
  findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Atualizar uma proposta por ID' })
  @ApiResponse({ status: 200, description: 'A proposta foi atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Proposta não encontrada.' })
  @ApiBody({ type: UpdateProposalDto })
  @ApiParam({ name: 'id', description: 'ID da proposta a ser atualizada' })
  update(@Param('id') id: string, @Body() updateProposalDto: UpdateProposalDto) {
    return this.proposalsService.update(id, updateProposalDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Excluir uma proposta por ID' })
  @ApiResponse({ status: 200, description: 'A proposta foi excluída com sucesso.' })
  @ApiResponse({ status: 404, description: 'Proposta não encontrada.' })
  @ApiParam({ name: 'id', description: 'ID da proposta a ser excluída' })
  remove(@Param('id') id: string) {
    return this.proposalsService.remove(id);
  }

  @Post(':id/version')
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Criar uma nova versão de uma proposta' })
  @ApiResponse({ status: 201, description: 'Uma nova versão da proposta foi criada.' })
  @ApiResponse({ status: 404, description: 'Proposta não encontrada.' })
  @ApiParam({ name: 'id', description: 'ID da proposta para versionar' })
  version(@Param('id') id: string) {
    return this.proposalsService.version(id);
  }
}
