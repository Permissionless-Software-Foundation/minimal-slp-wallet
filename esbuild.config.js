import * as esbuild from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'

// Build browser bundle (IIFE format)
esbuild.build({
  entryPoints: ['index.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'SlpWallet',
  outfile: 'dist/minimal-slp-wallet.min.js',
  plugins: [
    polyfillNode({
      polyfills: {
        crypto: true,
        buffer: true,
        stream: true,
        assert: true,
        process: true,
        util: true,
        events: true
      }
    })
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
    global: 'globalThis'
  }
}).then(() => {
  console.log('Browser bundle built successfully!')
}).catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
