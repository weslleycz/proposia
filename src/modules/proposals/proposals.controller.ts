import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
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
import { ProposalPdfService } from 'src/common/services';
import { CreateProposalDto, FindProposalsDto, UpdateProposalDto } from './dto';
import { ProposalsService } from './proposals.service';

@ApiTags('propostas')
@Controller('proposals')
export class ProposalsController {
  constructor(
    private readonly proposalsService: ProposalsService,
    private readonly proposalPdfService: ProposalPdfService,
  ) {}

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
  @ApiOperation({ summary: 'Obter todas as propostas' })
  @ApiResponse({ status: 200, description: 'Retorna todas as propostas.' })
  @ApiQuery({ type: FindProposalsDto })
  findAll(@Query() query: FindProposalsDto) {
    return this.proposalsService.findAll(query);
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
  @ApiOperation({ summary: 'Excluir uma proposta por ID' })
  @ApiResponse({
    status: 200,
    description: 'A proposta foi excluída com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Proposta não encontrada.' })
  @ApiParam({ name: 'id', description: 'ID da proposta a ser excluída' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.proposalsService.remove(id, req.user.userId);
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: express.Response) {
    const proposal = await this.proposalsService.findOne(id);
    const pdfBuffer = await this.proposalPdfService.generate(proposal);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=proposal-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

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