import app from './app';
import { env } from './config/env';
import { initTokenCleanupCron } from './cron/tokenCleanup';

const PORT = env.PORT;

app.listen(Number(PORT),"0.0.0.0", () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  initTokenCleanupCron();
  console.log("⏰ Cron job pembersihan token berhasil diaktifkan.");
});
