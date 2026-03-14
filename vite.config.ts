import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: true,
    middlewareMode: false,
    watch: {
      // 启用监听 playground 源文件
      ignored: ['!**/playground/**'],
    },
    hmr: {
      // 启用热模块替换
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: [],
  },
})
