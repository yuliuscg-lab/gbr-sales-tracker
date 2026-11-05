import * as pdfjsLib from 'pdfjs-dist';
import type { jsPDF } from 'jspdf';

// Konfigurasi path worker PDF.js (menggunakan CDN resmi versi yang terpasang)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Mengonversi halaman pertama dokumen jsPDF menjadi file gambar JPG beresolusi tinggi
 */
export const downloadPdfAsJpg = async (doc: jsPDF, fileName: string) => {
    try {
        // 1. Ekstrak data biner ArrayBuffer dari jsPDF
        const pdfData = doc.output('arraybuffer');

        // 2. Muat dokumen melalui PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        // 3. Ambil halaman pertama
        const page = await pdf.getPage(1);

        // Skala 2.5 agar teks dan angka tajam saat dizoom di WhatsApp
        const viewport = page.getViewport({ scale: 2.5 });

        // 4. Siapkan Canvas di memori
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (!context) {
            throw new Error('Gagal menginisialisasi canvas context');
        }

        // Beri latar belakang putih pekat sebelum render
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // 5. Render halaman PDF ke canvas
        await page.render({
            canvasContext: context,
            canvas,
            viewport,
        }).promise;

        // 6. Konversi canvas ke format JPEG (kualitas 0.92)
        const jpgUrl = canvas.toDataURL('image/jpeg', 0.92);

        // 7. Unduh otomatis
        const downloadLink = document.createElement('a');
        downloadLink.href = jpgUrl;
        downloadLink.download = `${fileName}.jpg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('Gagal mengonversi PDF ke JPG:', error);
        alert('Terjadi kesalahan saat memproses gambar JPG');
    }
};
