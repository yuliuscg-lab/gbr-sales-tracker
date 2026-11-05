export const normalizePhoneNumber = (phone?: string | null): string | null => {
    if (!phone) return null;

    // 1. Bersihkan semua karakter selain angka (spasi, tanda hubung, kurung, dsb.)
    let clean = phone.replace(/\D/g, '');

    if (!clean) return null;

    // 2. Jika diawali '08', ganti '0' dengan '62' -> '628...'
    if (clean.startsWith('08')) {
        clean = '62' + clean.slice(1);
    }
    // 3. Jika diawali '8', tambahkan '62' di depannya -> '628...'
    else if (clean.startsWith('8')) {
        clean = '62' + clean;
    }

    return clean;
};
