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

const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
    });
};

export const downloadDeliveryOrderPdf = async (order: OrderRecord) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = 14;
    const rightEdgeX = pageWidth - rightMargin;

    try {
        // Path sesuai letak file logo Anda (misal di folder public/logo-gbr.png)
        const logoImg = await loadImage('src/assets/logo-gbr.png');

        /**
         * doc.addImage(image, format, x, y, width, height)
         * Format: 'PNG' / 'JPEG' / 'WEBP'
         * Unit ukuran: mm (sesuai konfigurasi doc jsPDF)
         */
        doc.addImage(logoImg, 'PNG', 175, 10, 16, 16);
    } catch (error) {
        console.warn(
            'Gagal memuat logo untuk PDF, invoice tetap dicetak tanpa logo:',
            error
        );
    }

    // Header Kartu Produksi
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('SURAT JALAN', 14, 22);

    // Garis Pemisah
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 27, rightEdgeX, 27);

    // Informasi Customer & Order
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);

    let customerNameY = 37;
    // Kolom Kiri: Informasi Customer
    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', 14, 32);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer?.name!, 14, customerNameY);
    if (order.customer?.city) {
        doc.text(order.customer.city, 14, customerNameY + 5);
    }

    // Kolom Kanan: Detail Order
    const rightColX = 125;
    doc.text(`No. Order        : ${order.orderNo}`, rightColX, 32);
    doc.text(`Tgl Pesanan    : ${formatDate(order.createdAt)}`, rightColX, 37);
    doc.text(
        `Tgl Kirim        : ${formatDate(order.deliveryDate)}`,
        rightColX,
        42
    );

    // Tabel Barang (Hanya item dan qty/satuan)
    const tableRows = (order.items || []).map((item, index) => [
        index + 1,
        (item as any).productName || item.name || 'Produk',
        `${item.quantity}`,
        `${(item as any).unitName || 'Pcs'}`,
    ]);

    autoTable(doc, {
        startY: 47,
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
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 25 },
        },
    });

    // Ambil posisi Y setelah tabel atau ringkasan tagihan selesai
    // Beri jarak vertikal sekitar 15-20 mm
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 80;
    let signY = finalY + 15;

    // Konfigurasi posisi horizontal kolom tanda tangan (A4 width = 210mm)
    const leftSignX = 40; // Titik tengah kolom tanda tangan kiri (Penerima)
    const rightSignX = 170; // Titik tengah kolom tanda tangan kanan (Toko / Kasir)

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    // 1. Label Atas
    doc.text('Diterima Oleh,', leftSignX, signY, { align: 'center' });
    doc.text('Hormat Kami,', rightSignX, signY, { align: 'center' });

    // 2. Beri ruang kosong vertikal untuk tanda tangan fisik (misal 18-20 mm)
    const lineY = signY + 18;

    // Garis bawah tanda tangan
    doc.setDrawColor(150); // Garis abu-abu netral
    doc.setLineWidth(0.3);

    // 3. Nama Terang / Keterangan di Bawah Garis
    doc.setFontSize(8);
    doc.text('( _________________________ )', leftSignX, lineY + 4, { align: 'center', });
    doc.text('( _________________________ )', rightSignX, lineY + 4, { align: 'center', });

    doc.save(`Surat_Jalan_${order.orderNo}_${order.customer?.name}.pdf`);
};
