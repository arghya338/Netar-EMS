import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverProxyTarget = command === 'serve'
    ? requireEnv(env.VITE_NETAR_SERVER_PROXY_TARGET, 'VITE_NETAR_SERVER_PROXY_TARGET')
    : undefined;

  return {
    plugins: [react()],
    server: serverProxyTarget ? {
      proxy: {
        '/api': {
          target: serverProxyTarget,
          changeOrigin: true,
        },
      },
    } : undefined,
  };
});

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} must be configured in client/.env or the process environment`);
  }
  return value;
}
