import { defineConfig } from 'vite'
import { resolve } from 'path'
import { glob } from 'glob'

const htmlFiles = glob.sync('src/**/*.html', {
  ignore: ['src/school/**'] // school 頁面使用非 module script，暫時排除
})
const input = {
  index: resolve(__dirname, 'index.html'),
  ...Object.fromEntries(
    htmlFiles.map(file => [
      file.replace('src/', '').replace('.html', '').replace(/[\\/]/g, '-'),
      resolve(__dirname, file)
    ])
  )
}

export default defineConfig({
  base: '/sample/',
  build: {
    outDir: 'dist',
    rollupOptions: { input },
  },
})
