import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrderRecord } from '../api/order';

const formatRupiah = (val: number | string) =>
    `Rp ${Number(val || 0).toLocaleString('id-ID')}`;

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

 //Watermark
    const renderWatermark = (doc: jsPDF, text: string) => {
        // Simpan konfigurasi grafis saat ini
        doc.saveGraphicsState();

        // Set transparansi (0.0 transparan penuh s/d 1.0 pekat)
        // 0.12 s/d 0.15 sangat pas: terbaca jelas namun teks tabel di bawahnya tetap terlihat
        doc.setGState(new (doc as any).GState({ opacity: 0.14 }));

        // Konfigurasi font & warna cap/watermark (merah / emerald lembut)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(60);
        doc.setTextColor(16, 185, 129); // Merah (#dc2626) atau ganti [16, 185, 129] untuk warna emerald

        // Ambil titik tengah halaman A4 (lebar 210mm, tinggi 297mm)
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const centerX = pageWidth / 2;
        const centerY = pageHeight / 2;

        // Cetak teks miring 35 derajat tepat di tengah
        doc.text(text, centerX, centerY, {
            align: 'center',
            angle: 35,
        });

        // Kembalikan konfigurasi grafis ke normal agar tidak mempengaruhi elemen lain
        doc.restoreGraphicsState();
    };

export const downloadInvoicePdf = async (order: OrderRecord) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const remaining = Math.max(0, order.totalAmount - (order.paidAmount || 0));
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
    // Header Toko
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FAKTUR PENJUALAN', 14, 22);

    // Garis Pemisah
    doc.setDrawColor(220);
    doc.setLineWidth(0.5);
    doc.line(14, 28, 196, 28);

    // Informasi Order & Pelanggan
    doc.setTextColor(50);
    doc.setFontSize(10);

    // Kolom Kiri: Pelanggan
    doc.setFont('helvetica', 'bold');
    doc.text('Kepada:', 14, 35);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer?.name!, 14, 40);
    if (order.customer?.phone) {
        doc.text(`Telp: ${order.customer.phone}`, 14, 45);
    }

    // Kolom Kanan: Detail Dokumen
    doc.text(`No. Pesanan     : ${order.orderNo}`, 125, 35);
    doc.text(`Tgl. Pesanan     : ${formatDate(order.createdAt)}`, 125, 40);
    doc.text(`Jatuh Tempo     : ${formatDate(order.dueDate)}`, 125, 45);

    // Tabel Barang Pesanan
    const tableRows = (order.items || []).map((item, index) => [
        index + 1,
        item.name,
        `${item.quantity}`,
        ` ${item.unitName}`,
        formatRupiah(item.unitPrice),
        formatRupiah(item.unitPrice * item.quantity),
    ]);

    autoTable(doc, {
        startY: 55,
        head: [
            [
                'No',
                'Deskripsi Barang',
                'Qty',
                'Unit',
                'Harga Satuan',
                'Subtotal',
            ],
        ],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'left', cellWidth: 25 },
            4: { halign: 'right', cellWidth: 35 },
            5: { halign: 'right', cellWidth: 35 },
        },
    });

    // Ambil posisi Y akhir tabel barang
    const finalY = (doc as any).lastAutoTable?.finalY || 80;

    // Ringkasan Finansial di Bawah Tabel
    const summaryX = 140;
    let cursorY = finalY + 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Total Tagihan', summaryX, cursorY);
    doc.text(`: ${formatRupiah(order.totalAmount)}`, summaryX + 32, cursorY);

    cursorY += 5;
    doc.text('Jumlah Terbayar', summaryX, cursorY);
    doc.text(
        `: ${formatRupiah(order.paidAmount || 0)}`,
        summaryX + 32,
        cursorY
    );

    cursorY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Sisa Tagihan', summaryX, cursorY);
    doc.text(`: ${formatRupiah(remaining)}`, summaryX + 32, cursorY);

    // Catatan Order
    if (order.notes) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Catatan: ${order.notes}`, 14, finalY + 8);
    }

    

    if (order.status === 'PAID') {
        renderWatermark(doc, '[ L U N A S ]');
    }
    // Unduh Berkas PDF
    doc.save(`Invoice_${order.orderNo}.pdf`);
};
