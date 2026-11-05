import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

app.listen(Number(PORT),"0.0.0.0", () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
