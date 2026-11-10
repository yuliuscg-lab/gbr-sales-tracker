import cron from 'node-cron';
import { authRepository } from '../repositories/auth.repository';

export function initTokenCleanupCron() {
    // Berjalan setiap hari pukul 02.00 pagi
    cron.schedule('0 2 * * *', async () => {
        try {
            console.log('[CRON] Menjalankan pembersihan refresh token...');
            const result = await authRepository.cleanStaleTokens(7); // Simpan riwayat revoked selama 7 hari
            console.log(
                `[CRON] Pembersihan selesai: ${result.count} token dihapus.`
            );
        } catch (error) {
            console.error('[CRON] Gagal membersihkan refresh token:', error);
        }
    });
}
