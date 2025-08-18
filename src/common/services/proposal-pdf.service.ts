import { Injectable } from '@nestjs/common';
import { Client, Proposal, ProposalItem } from '@prisma/client';
import PDFDocument from 'pdfkit';

type FullProposal = Proposal & { items: ProposalItem[]; client: Client };

const FONT_NORMAL = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const MARGIN = 50;

@Injectable()
export class ProposalPdfService {
  async generate(proposal: FullProposal): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      bufferPages: true,
    });

    this._generateHeader(doc, proposal);
    this._generateClientInfo(doc, proposal);
    this._generateProposalTable(doc, proposal);
    this._generateTotalAmount(doc, proposal);
    this._generateFooter(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));
    });
  }

  private _formatCurrency(cents: number): string {
    const valueInReal = cents / 100;
    return valueInReal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private _generateHeader(
    doc: PDFKit.PDFDocument,
    proposal: FullProposal,
  ): void {
    doc
      .font(FONT_BOLD)
      .fontSize(20)
      .text('EMPRESA XYZ', { align: 'center' })
      .moveDown(0.5);

    doc
      .font(FONT_NORMAL)
      .fontSize(16)
      .text(`Proposta Comercial: ${proposal.title}`, { align: 'center' })
      .moveDown(2);
  }

  private _generateClientInfo(
    doc: PDFKit.PDFDocument,
    proposal: FullProposal,
  ): void {
    doc.font(FONT_BOLD).fontSize(12).text('INFORMAÇÕES DO CLIENTE');
    doc.rect(doc.x, doc.y, 510, 80).stroke();
    doc.moveDown(0.5);

    const startX = doc.x + 10;

    doc
      .font(FONT_NORMAL)
      .text(`Cliente: ${proposal.client.name}`, startX)
      .text(`Email: ${proposal.client.email || '-'}`)
      .text(`Telefone: ${proposal.client.phone || '-'}`)
      .text(`CNPJ/CPF: ${proposal.client.cnpjCpf || '-'}`)
      .text(`Endereço: ${proposal.client.address || '-'}`)
      .moveDown(2);
  }

  private _generateProposalTable(
    doc: PDFKit.PDFDocument,
    proposal: FullProposal,
  ): void {
    doc
      .font(FONT_BOLD)
      .fontSize(14)
      .text('Itens da Proposta', { underline: true })
      .moveDown();

    const tableTop = doc.y;
    const tableHeaders = ['Descrição', 'Qtd', 'Preço Unit.', 'Total'];

    this._generateTableRow(
      doc,
      tableTop,
      true,
      ...tableHeaders.map((h) => ({ text: h })),
    );

    let y = tableTop + 25;

    proposal.items.forEach((item) => {
      const descriptionText =
        item.description === 'string' ? '---' : item.description;

      const descriptionHeight = doc.heightOfString(descriptionText, {
        width: 250,
      });
      const rowHeight = descriptionHeight + 10;

      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.y;
        this._generateTableRow(
          doc,
          y,
          true,
          ...tableHeaders.map((h) => ({ text: h })),
        );
        y += 25;
      }

      this._generateTableRow(
        doc,
        y,
        false,
        { text: descriptionText, options: { width: 250 } },
        { text: item.quantity.toString(), options: { align: 'right' } },
        {
          text: this._formatCurrency(item.unitPrice),
          options: { align: 'right' },
        },
        { text: this._formatCurrency(item.total), options: { align: 'right' } },
      );

      y += rowHeight;
    });

    doc.y = y + 20;
  }

  private _generateTableRow(
    doc: PDFKit.PDFDocument,
    y: number,
    isHeader: boolean,
    ...cells: { text: string; options?: PDFKit.Mixins.TextOptions }[]
  ): void {
    doc.font(isHeader ? FONT_BOLD : FONT_NORMAL).fontSize(10);

    const colPositions = [MARGIN, 300, 370, 450, 550];
    let maxHeight = 0;

    cells.forEach((cell, i) => {
      const cellWidth = colPositions[i + 1] - colPositions[i] - 10;
      const height = doc.heightOfString(cell.text, {
        width: cellWidth,
        ...cell.options,
      });
      if (height > maxHeight) maxHeight = height;
    });

    cells.forEach((cell, i) => {
      const cellWidth = colPositions[i + 1] - colPositions[i] - 10;
      doc.text(cell.text, colPositions[i], y, {
        width: cellWidth,
        ...cell.options,
      });
    });

    doc
      .moveTo(MARGIN, y + maxHeight + 5)
      .lineTo(doc.page.width - MARGIN, y + maxHeight + 5)
      .stroke();
  }

  private _generateTotalAmount(
    doc: PDFKit.PDFDocument,
    proposal: FullProposal,
  ): void {
    doc
      .font(FONT_BOLD)
      .fontSize(12)
      .text(`Valor Total: ${this._formatCurrency(proposal.totalAmount)}`, {
        align: 'right',
      })
      .moveDown(3);
  }

  private _generateFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      doc
        .font(FONT_NORMAL)
        .fontSize(8)
        .text(
          'Obrigado por considerar nossa proposta!',
          MARGIN,
          doc.page.height - 40,
          { align: 'center' },
        )
        .text('EMPRESA XYZ - Rua Exemplo, 123 - Cidade/Estado', {
          align: 'center',
        })
        .text(`Página ${i + 1} de ${pageCount}`, { align: 'right' });
    }
  }
}