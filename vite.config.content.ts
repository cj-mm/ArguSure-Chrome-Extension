// TypeScript allows us to safely import JSON with assertion
import packageJson from './package.json' assert { type: 'json' }

import { defineConfig, Plugin, ResolvedConfig, BuildOptions } from 'vite'
import { isDev, r } from './scripts/utility'
import react from '@vitejs/plugin-react'
import path from 'path'

const { name }: { name: string } = packageJson

console.info(' ---> Starting Content Script Build 🤞 <---')

const config = defineConfig({
    plugins: [react()],

    resolve: {
        alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }]
    },

    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    },

    build: {
        // Only enable watch mode during development
        watch: isDev ? { include: ['./src/**/*'] } : null,
        outDir: r('dist/js'),
        cssCodeSplit: false,
        emptyOutDir: false,
        sourcemap: isDev ? 'inline' : false,
        lib: {
            entry: r('src/scripts/content/index.tsx'),
            name: name,
            formats: ['iife']
        },
        rollupOptions: {
            output: {
                entryFileNames: 'content.js',
                extend: true
            }
        }
    } as BuildOptions
})

export default config
