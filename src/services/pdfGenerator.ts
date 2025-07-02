import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Maleta } from './maletas';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export const generateMaletaPDF = (maleta: Maleta) => {
  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ROMANEIO DE MALETA', 105, 20, { align: 'center' });
    
    // Maleta info
    doc.setFontSize(16);
    doc.text(`Maleta #${maleta.number}`, 105, 35, { align: 'center' });
    
    // Representative info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Consultor(a):', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(maleta.representative_name || 'N/A', 55, 55);
    
    // Contact info (mock - in real implementation would come from database)
    doc.text('E-mail:', 20, 65);
    doc.text('representante@email.com', 40, 65);
    
    doc.text('WhatsApp:', 120, 55);
    doc.text('(11) 99999-9999', 150, 55);
    
    // Dates
    doc.text('Data Início:', 20, 75);
    doc.text(new Date(maleta.departure_date).toLocaleDateString('pt-BR'), 50, 75);
    
    doc.text('Data Devolução:', 120, 75);
    doc.text(new Date(maleta.return_date).toLocaleDateString('pt-BR'), 165, 75);
    
    // Products table
    if (maleta.items && maleta.items.length > 0) {
      const tableData = maleta.items.map((item, index) => [
        index + 1,
        item.sku || 'N/A',
        item.name || 'N/A',
        item.quantity || 0,
        `R$ ${parseFloat(item.price || '0').toFixed(2)}`
      ]);
      
      doc.autoTable({
        head: [['ID', 'Código', 'Descrição', 'Quantidade', 'Valor']],
        body: tableData,
        startY: 90,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 30 },
          2: { cellWidth: 80 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
        },
      });
    }
    
    // Summary
    const finalY = (doc as any).lastAutoTable?.finalY || 120;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Valor total da maleta: R$ ${parseFloat(maleta.total_value || '0').toFixed(2)}`, 20, finalY + 20);
    
    if (maleta.items && maleta.items.length > 0) {
      const totalItems = maleta.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      doc.text(`Quantidade total de produtos: ${totalItems}`, 20, finalY + 30);
    }
    
    // Commission info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Comissão de vendas', 20, finalY + 50);
    doc.setFont('helvetica', 'normal');
    
    if (maleta.commission_settings?.use_global && maleta.commission_settings?.tiers) {
      maleta.commission_settings.tiers.forEach((tier, index) => {
        const yPos = finalY + 60 + (index * 8);
        doc.text(
          `${tier.label}: De R$ ${tier.min_amount},00 a R$ ${tier.max_amount || '∞'} = ${tier.percentage}% + R$ ${tier.bonus},00`,
          20,
          yPos
        );
      });
    } else {
      doc.text(`Comissão personalizada: ${maleta.commission_percentage || '0'}%`, 20, finalY + 60);
    }
    
    // Footer info
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text('Bônus especial', 20, pageHeight - 50);
    doc.text('A revendedora que alcançar o primeiro lugar no mês poderá escolher', 20, pageHeight - 45);
    doc.text('qualquer peça da loja. A pessoa precisa vender mais que R$1.000,00', 20, pageHeight - 40);
    doc.text('para ter o benefício!', 20, pageHeight - 35);
    
    doc.text('Indicação de revendedoras', 120, pageHeight - 50);
    doc.text('Quem indicar uma nova revendedora e ficar responsável por ela ganhará 10%', 120, pageHeight - 45);
    doc.text('sobre as vendas que ela fizer. Essa é uma ótima oportunidade para aumentar', 120, pageHeight - 40);
    doc.text('seus ganhos!', 120, pageHeight - 35);
    
    // Date and signature
    doc.text(`${new Date().toLocaleDateString('pt-BR')}`, 105, pageHeight - 20, { align: 'center' });
    doc.line(20, pageHeight - 10, 80, pageHeight - 10);
    doc.text(maleta.representative_name || 'N/A', 50, pageHeight - 5, { align: 'center' });
    
    // Save the PDF
    doc.save(`Maleta-${maleta.number}-Romaneio.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Falha ao gerar PDF');
  }
};