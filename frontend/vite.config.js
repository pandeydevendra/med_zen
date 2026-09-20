import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'

// Load env/<mode>.env (local_dev.env, prod.env) into process.env so Vite exposes
// its VITE_* values to the app. Variables already set in the shell take priority.
function loadModeEnv(mode) {
  const file = new URL(`./env/${mode}.env`, import.meta.url)
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/)
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2]
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  loadModeEnv(mode)
  return { plugins: [react()] }
})
