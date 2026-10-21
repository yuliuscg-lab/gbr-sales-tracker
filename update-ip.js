// update-ip.js
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            // Cari IPv4 non-internal (bukan 127.0.0.1)
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
            if (net.family === familyV4Value && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

const localIp = getLocalIpAddress();
const envPath = path.resolve(__dirname, 'frontend', '.env');
const port = 5000;
const newApiUrl = `VITE_API_URL=http://${localIp}:${port}/api`;

let envContent = '';
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('VITE_API_URL=')) {
        envContent = envContent.replace(/VITE_API_URL=.*/g, newApiUrl);
    } else {
        envContent += `\n${newApiUrl}\n`;
    }
} else {
    envContent = `${newApiUrl}\n`;
}

fs.writeFileSync(envPath, envContent, 'utf-8');
console.log(`[Auto-IP] Terdeteksi IP: ${localIp}`);
console.log(`[Auto-IP] frontend/.env berhasil diupdate -> ${newApiUrl}`);
