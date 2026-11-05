import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrderRecord } from '../api/order';

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

export const downloadProductionCardPdf = (order: OrderRecord) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = 14;
    const rightEdgeX = pageWidth - rightMargin;

    // Header Kartu Produksi
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('KARTU PRODUKSI', 14, 18);

    // Garis Pemisah
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 22, rightEdgeX, 22);

    // Informasi Customer & Order
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);

    let customerNameY = 33;
    // Kolom Kiri: Informasi Customer
    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', 14, 28);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer?.name!, 14, customerNameY);
    if (order.customer?.city) {
        doc.text(order.customer.city, 14, customerNameY + 5);
        customerNameY += 5;
    }

    // Kolom Kanan: Detail Order
    const rightColX = 125;
    doc.text(`No. Order        : ${order.orderNo}`, rightColX, 28);
    doc.text(`Tgl Pesanan    : ${formatDate(order.createdAt)}`, rightColX, 33);
    doc.text(`Target Kirim     : ${formatDate(order.deliveryDate)}`, rightColX, 38);


    // Tabel Barang (Hanya item dan qty/satuan)
    const tableRows = (order.items || []).map((item, index) => [
        index + 1,
        (item as any).productName || item.name || 'Produk',
        `${item.quantity}`,
        `${(item as any).unitName || 'Pcs'}`,
    ]);

    autoTable(doc, {
        startY: 50,
        head: [['No', 'Nama Item / Produk', 'Jumlah', 'Satuan']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
        },
        styles: {
            fontSize: 9,
            cellPadding: 3.5,
            lineWidth:0.1,
            lineColor: [0,0,0]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 25 },
        },
    });


    doc.save(`Kartu_Produksi_${order.orderNo}.pdf`);
};
