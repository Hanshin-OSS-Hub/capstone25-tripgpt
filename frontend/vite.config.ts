import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'sonner': 'sonner',
      'vaul': 'vaul',
      'recharts': 'recharts',
      'react-resizable-panels': 'react-resizable-panels',
      'react-hook-form': 'react-hook-form',
      'react-day-picker': 'react-day-picker',
      'next-themes': 'next-themes',
      'lucide-react': 'lucide-react',
      'input-otp': 'input-otp',
      
      'figma:asset/9e963221...png': path.resolve(__dirname, './src/assets/9e963221c3f1733a027a15bc5330b412361c056e.png'),
      'figma:asset/317ecf22...png': path.resolve(__dirname, './src/assets/317ecf22f4837f9b82c5c22fbf3f2d1c8e4fd081.png'),
      'figma:asset/0770d9d3...png': path.resolve(__dirname, './src/assets/0770d9d3ce5a6ffbfdb1fb147a646aec241ad03e.png'),

      // Radix UI
      '@radix-ui/react-tooltip': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle': '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group': '@radix-ui/react-toggle-group',
      '@radix-ui/react-tabs': '@radix-ui/react-tabs',
      '@radix-ui/react-switch': '@radix-ui/react-switch',
      '@radix-ui/react-slot': '@radix-ui/react-slot',
      '@radix-ui/react-slider': '@radix-ui/react-slider',
      '@radix-ui/react-separator': '@radix-ui/react-separator',
      '@radix-ui/react-select': '@radix-ui/react-select',
      '@radix-ui/react-scroll-area': '@radix-ui/react-scroll-area',
      '@radix-ui/react-radio-group': '@radix-ui/react-radio-group',
      '@radix-ui/react-progress': '@radix-ui/react-progress',
      '@radix-ui/react-popover': '@radix-ui/react-popover',
      '@radix-ui/react-navigation-menu': '@radix-ui/react-navigation-menu',
      '@radix-ui/react-menubar': '@radix-ui/react-menubar',
      '@radix-ui/react-label': '@radix-ui/react-label',
      '@radix-ui/react-hover-card': '@radix-ui/react-hover-card',
      '@radix-ui/react-dropdown-menu': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog': '@radix-ui/react-dialog',
      '@radix-ui/react-context-menu': '@radix-ui/react-context-menu',
      '@radix-ui/react-collapsible': '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox': '@radix-ui/react-checkbox',
      '@radix-ui/react-avatar': '@radix-ui/react-avatar',
      '@radix-ui/react-aspect-ratio': '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion': '@radix-ui/react-accordion',

      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },
});
