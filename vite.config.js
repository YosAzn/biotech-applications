import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/biotech-applications/', // נתיב ה-Pages של מעבדת היישומים
})