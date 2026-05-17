import { defineConfig } from 'vite'
import { resolve } from 'path'
import { glob } from 'glob'
import { cpSync, existsSync } from 'fs'

function copyStaticFolders() {
  return {
    name: 'copy-static-folders',
    closeBundle() {
      for (const folder of ['image', 'webP', 'svg', 'sound']) {
        const src = resolve(__dirname, `src/${folder}`)
        const dest = resolve(__dirname, `dist/src/${folder}`)
        if (existsSync(src)) cpSync(src, dest, { recursive: true })
      }
    }
  }
}

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

export default defineConfig(() => ({
  base: './',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    rollupOptions: { input },
  },
  plugins: [copyStaticFolders()],
}))
