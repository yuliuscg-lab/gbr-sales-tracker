import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AggregatePdfPayload {
    cardNo: string;
    createdAt: string;
    notes?: string | null;
    orders: {
        id: string;
        orderNo: string;
        dueDate?: string | null;
        notes?: string | null;
        customer?: { name: string; phone?: string | null } | null;
        items?: {
            name: string;
            unitName: string;
            quantity: number;
            isProductionItem?: boolean; // Flag penanda item produksi
        }[];
    }[];
}

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const downloadAggregateProductionPdf = (
    payload: AggregatePdfPayload
) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const rightEdgeX = pageWidth - 14;

    // 1. Header Dokumen
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('KARTU PRODUKSI', 14, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);

    // Garis Pemisah
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 28, rightEdgeX, 28);

    // 2. Info Nomor Kartu & Metadata
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);

    doc.setFont('helvetica', 'bold');
    doc.text(`No. Kartu   : ${payload.cardNo}`, 14, 35);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tgl Dibuat  : ${formatDate(payload.createdAt)}`, 14, 40);
    doc.text(`Total Order : ${payload.orders.length} Pesanan`, 14, 45);

    // Order Badges di kanan atas
    const orderListStr = payload.orders.map((o) => o.orderNo).join(', ');
    doc.setFont('helvetica', 'italic');
    doc.text(`Batch Order : ${orderListStr}`, 105, 35, { maxWidth: 90 });

    // 3. Hitung Agregasi Produk (EXCLUDE NON-PRODUCTION ITEMS)
    const aggregatedMap: Record<
        string,
        { name: string; unitName: string; totalQty: number }
    > = {};

    payload.orders.forEach((ord) => {
        (ord.items || []).forEach((item) => {
            // Abaikan jika item bukan item produksi (isProductionItem === false)
            if (!item.isProductionItem) return;

            const key = `${item.name}__${item.unitName}`.toLowerCase();
            if (!aggregatedMap[key]) {
                aggregatedMap[key] = {
                    name: item.name,
                    unitName: item.unitName,
                    totalQty: 0,
                };
            }
            aggregatedMap[key].totalQty += Number(item.quantity);
        });
    });

    const aggregatedItems = Object.values(aggregatedMap).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    const tableRows = aggregatedItems.map((item, index) => [
        index + 1,
        item.name,
        `${item.totalQty.toLocaleString('id-ID')} ${item.unitName}`,
        '[   ]', // Kolom ceklis fisik operator lantai kerja
    ]);

    // 4. Render Tabel Produk Agregat
    autoTable(doc, {
        startY: 52,
        head: [
            [
                'No',
                'Nama Produk / Barang',
                'Jumlah Produksi',
                'Ceklis',
            ],
        ],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.1,
            lineColor: [0,0,0],
        },
        styles: {
            fontSize: 9,
            cellPadding: 3.5,
            lineColor:[0,0,0],
            lineWidth:0.1,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center', cellWidth: 48 },
            3: { halign: 'center', cellWidth: 28 },
        },
    });

    let finalY = (doc as any).lastAutoTable?.finalY || 80;

    // 5. Tabel Daftar Alokasi Pesanan Pelanggan
    finalY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Alokasi Hasil Produksi:', 14, finalY);

    const orderRows = payload.orders.map((ord, idx) => {
        // Filter hanya item produksi untuk order ini
        const prodItems = (ord.items || []).filter(
            (it) => it.isProductionItem ===true
        );

        // Format rincian qty barang produksi per order (misal: "10 Pcs Umpan A\n2 Dus Pelet B")
        const qtyPerOrderText =
            prodItems.length > 0
                ? prodItems
                      .map((it) => `${it.quantity} ${it.unitName} - ${it.name}`)
                      .join('\n')
                : '-';

        const formattedDueDate = ord.dueDate
            ? new Date(ord.dueDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
              })
            : '-';

        return [
            idx + 1,
            ord.orderNo,
            ord.customer?.name || 'Pelanggan Umum',
            formattedDueDate,
            qtyPerOrderText, // <-- Kolom Qty per Order baru
            ord.notes || '-',
        ];
    });

    autoTable(doc, {
        startY: finalY + 4,
        head: [
            [
                'No',
                'No. Order',
                'Customer',
                'Target Kirim',
                'Detail Barang',
                'Catatan Khusus',
            ],
        ],
        body: orderRows,
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: 8.5,
            halign: 'center',
            lineWidth:0.1,
            lineColor:[0,0,0],
        },
        styles: {
            fontSize: 8,
            cellPadding: 2.5,
            valign: 'middle',
            lineColor: [0,0,0],
            lineWidth:0.1
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 25 },
            2: { cellWidth: 32 },
            3: { halign: 'center', cellWidth: 22 },
            4: { cellWidth: 55 }, // Kolom Qty per Order
            5: { cellWidth: 38 },
        },
    });

    doc.save(`Kartu_Produksi_${payload.cardNo}.pdf`);
};
