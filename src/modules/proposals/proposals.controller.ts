import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import express from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import type { RequestWithUser } from 'src/common/interfaces';
import { CreateProposalDto, FindProposalsDto, UpdateProposalDto } from './dto';
import { ProposalsService } from './proposals.service';
import { FindDeletedProposalsDto } from './dto/find-deleted-proposals.dto';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('propostas')
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Criar uma nova proposta' })
  @ApiResponse({
    status: 201,
    description: 'A proposta foi criada com sucesso.',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiBody({ type: CreateProposalDto })
  create(
    @Body() createProposalDto: CreateProposalDto,
    @Req() req: RequestWithUser,
  ) {
    return this.proposalsService.create(createProposalDto, req.user.userId);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Obter todas as propostas ativas' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todas as propostas ativas.',
  })
  @ApiQuery({ type: FindProposalsDto })
  findAll(@Query() query: FindProposalsDto) {
    return this.proposalsService.findAll(query);
  }

  @Get('deleted')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('deleted_proposals')
  @CacheTTL(300)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obter todas as propostas deletadas' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todas as propostas deletadas.',
  })
  @ApiQuery({ type: FindDeletedProposalsDto })
  findDeleted(@Query() query: FindDeletedProposalsDto) {
    return this.proposalsService.findDeleted(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Obter uma proposta por ID' })
  @ApiResponse({ status: 200, description: 'Retorna uma única proposta.' })
  @ApiResponse({ status: 404, description: 'Proposta não encontrada.' })
  @ApiParam({ name: 'id', description: 'ID da proposta a ser recuperada' })
  findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Atualizar uma proposta por ID' })
  @ApiResponse({
    status: 200,
    description: 'A proposta foi atualizada com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Proposta não encontrada.' })
  @ApiBody({ type: UpdateProposalDto })
  @ApiParam({ name: 'id', description: 'ID da proposta a ser atualizada' })
  update(
    @Param('id') id: string,
    @Body() updateProposalDto: UpdateProposalDto,
    @Req() req: RequestWithUser,
  ) {
    return this.proposalsService.update(id, updateProposalDto, req.user.userId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Deletar uma proposta por ID (Soft Delete)' })
  @ApiResponse({
    status: 200,
    description: 'A proposta foi movida para a lixeira.',
  })
  @ApiResponse({ status: 404, description: 'Proposta não encontrada.' })
  @ApiParam({ name: 'id', description: 'ID da proposta a ser deletada' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.proposalsService.remove(id, req.user.userId);
  }

  @Patch(':id/restore')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Restaurar uma proposta deletada' })
  @ApiResponse({
    status: 200,
    description: 'A proposta foi restaurada com sucesso.',
  })
  @ApiResponse({
    status: 404,
    description: 'Proposta deletada não encontrada.',
  })
  @ApiParam({ name: 'id', description: 'ID da proposta a ser restaurada' })
  restore(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.proposalsService.restore(id, req.user.userId);
  }

  @Patch(':proposalId/revert/:logId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Reverter uma proposta para uma versão anterior' })
  @ApiResponse({
    status: 200,
    description: 'A proposta foi revertida com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Proposta ou log não encontrado.' })
  @ApiParam({
    name: 'proposalId',
    description: 'ID da proposta a ser revertida',
  })
  @ApiParam({ name: 'logId', description: 'ID do log para o qual reverter' })
  revert(
    @Param('proposalId') proposalId: string,
    @Param('logId') logId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.proposalsService.revert(proposalId, logId, req.user.userId);
  }

  // @Get(':id/pdf')
  // async getPdf(@Param('id') id: string, @Res() res: express.Response) {
  //   const proposal = await this.proposalsService.findOne(id);
  //   if (!proposal.pdfUrl) {
  //     throw new NotFoundException(`PDF for proposal with ID "${id}" not found`);
  //   }
  //   res.redirect(proposal.pdfUrl);
  // }

  @Get(':id/logs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SALESPERSON)
  @ApiOperation({ summary: 'Obter logs de uma proposta por ID' })
  @ApiResponse({ status: 200, description: 'Retorna os logs da proposta.' })
  @ApiResponse({ status: 404, description: 'Proposta não encontrada.' })
  @ApiParam({ name: 'id', description: 'ID da proposta para obter os logs' })
  findLogs(@Param('id') id: string) {
    return this.proposalsService.findLogsByProposalId(id);
  }
}
