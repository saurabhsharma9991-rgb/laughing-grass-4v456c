/** @type {import('next').NextConfig} */
const allowedDevOrigins = [
  // ngrok tunnels (free + paid) — required for HMR over public URL
  "*.ngrok-free.dev",
  "*.ngrok.app",
  "*.ngrok.io",
];

// Optional: set NGROK_HOST=sleekit-temptable-ellis.ngrok-free.dev in .env if wildcards don't match
if (process.env.NGROK_HOST) {
  allowedDevOrigins.push(process.env.NGROK_HOST);
}

const nextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
