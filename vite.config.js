import { defineConfig } from 'vite'
import { resolve } from 'path'
import { glob } from 'glob'
import { cpSync, existsSync, rmSync } from 'fs'

function stripHtmlComments() {
  return {
    name: 'strip-html-comments',
    transformIndexHtml(html) {
      return html.replace(/<!--[\s\S]*?-->/g, '')
    }
  }
}

function flattenSrcDir() {
  return {
    name: 'flatten-src-dir',
    closeBundle() {
      const srcDir = resolve(__dirname, 'dist/src')
      if (existsSync(srcDir)) {
        cpSync(srcDir, resolve(__dirname, 'dist'), { recursive: true })
        rmSync(srcDir, { recursive: true })
      }
    }
  }
}

function copyStaticFolders() {
  return {
    name: 'copy-static-folders',
    closeBundle() {
      for (const folder of ['image', 'webP', 'svg', 'sound']) {
        const src = resolve(__dirname, `src/${folder}`)
        const dest = resolve(__dirname, `dist/src/${folder}`)
        if (existsSync(src)) cpSync(src, dest, { recursive: true })
      }
      for (const file of ['robots.txt', 'sitemap.xml']) {
        const src = resolve(__dirname, file)
        if (existsSync(src)) cpSync(src, resolve(__dirname, `dist/${file}`))
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
  base: '/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    rollupOptions: { input },
  },
  plugins: [stripHtmlComments(), copyStaticFolders(), flattenSrcDir()],
}))
