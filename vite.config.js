import { defineConfig } from 'vite'
import { resolve } from 'path'
import { glob } from 'glob'
import { cpSync, existsSync, rmSync, readFileSync } from 'fs'
import { execSync } from 'child_process'

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
                     url.startsWith('/favicon') || url.startsWith('/__vite') ||
                     url.startsWith('/sw.js') || url.startsWith('/robots.txt') || url.startsWith('/sitemap.xml')
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

      // 特別處理 school 目錄：把 dist/src/school 的 JS/CSS 複製到 dist/school 根目錄
      const schoolSrcPath = resolve(__dirname, 'dist/school/src/school')
      const schoolDestPath = resolve(__dirname, 'dist/school')
      if (existsSync(schoolSrcPath)) {
        const files = glob.sync('dist/school/src/school/*')
        files.forEach(file => {
          const fileName = file.split(/[\\/]/).pop()
          if (fileName && (fileName.endsWith('.js') || fileName.endsWith('.css'))) {
            cpSync(file, resolve(schoolDestPath, fileName))
          }
        })
        rmSync(resolve(__dirname, 'dist/school/src'), { recursive: true })
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
      // llms.txt（在 src/ 底下）
      const llmsSrc = resolve(__dirname, 'src/llms.txt')
      if (existsSync(llmsSrc)) cpSync(llmsSrc, resolve(__dirname, 'dist/llms.txt'))
      // favicon（在 src/ 底下）
      const faviconSrc = resolve(__dirname, 'src/treasurehubIcon.ico')
      if (existsSync(faviconSrc)) cpSync(faviconSrc, resolve(__dirname, 'dist/treasurehubIcon.ico'))
      // PWA manifest
      const manifestSrc = resolve(__dirname, 'src/manifest.json')
      if (existsSync(manifestSrc)) cpSync(manifestSrc, resolve(__dirname, 'dist/manifest.json'))
      // 複製 school 目錄中的 JS 和 CSS 文件
      const schoolSrcDir = resolve(__dirname, 'src/school')
      const schoolDestDir = resolve(__dirname, 'dist/school')
      if (existsSync(schoolSrcDir)) {
        const jsFiles = glob.sync('src/school/*.js')
        const cssFiles = glob.sync('src/school/*.css')
        ;[...jsFiles, ...cssFiles].forEach(file => {
          const fileName = file.split('/').pop()
          cpSync(file, resolve(schoolDestDir, fileName))
        })
      }
    }
  }
}

const htmlFiles = glob.sync('src/**/*.html', {
  ignore: []
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

const pkgVersion = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')).version
let gitCommit = 'unknown'
try {
  gitCommit = execSync('git rev-parse --short HEAD').toString().trim()
} catch {}

export default defineConfig(() => ({
  base: '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkgVersion),
    'import.meta.env.VITE_GIT_COMMIT': JSON.stringify(gitCommit),
  },
  server: {
    port: 3000,
    // https: existsSync('localhost+1-key.pem') && existsSync('localhost+1.pem') ? {
    //   key: readFileSync('localhost+1-key.pem'),
    //   cert: readFileSync('localhost+1.pem'),
    // } : true,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.SOURCE_MAP === 'true',
    rollupOptions: { input },
  },
  plugins: [devSrcRewrite(), stripHtmlComments(), copyStaticFolders(), flattenSrcDir()],
}))
