import { defineConfig } from 'vite'
import { resolve } from 'path'
import { glob } from 'glob'
import { cpSync, existsSync, rmSync } from 'fs'

// dev server：把所有非 Vite 系統路徑自動 rewrite 到 /src/
// 並移除 CSP meta 讓 localhost 可以連 treasurehub.tw API
function devSrcRewrite() {
  return {
    name: 'dev-src-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        const skip = url.startsWith('/src/') || url.startsWith('/@') ||
                     url.startsWith('/node_modules') || url === '/' ||
                     url.startsWith('/favicon') || url.startsWith('/__vite')
        if (!skip) {
          req.url = '/src' + url
        }
        next()
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // 只在 dev 時移除 CSP meta tag，讓 localhost 能連外部 API
        if (ctx.server) {
          return html.replace(/<meta[^>]+Content-Security-Policy[^>]*>/gi, '')
        }
        return html
      }
    }
  }
}

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
      // PWA manifest
      const manifestSrc = resolve(__dirname, 'src/manifest.json')
      if (existsSync(manifestSrc)) cpSync(manifestSrc, resolve(__dirname, 'dist/manifest.json'))
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
  plugins: [devSrcRewrite(), stripHtmlComments(), copyStaticFolders(), flattenSrcDir()],
}))
