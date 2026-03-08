/**
 * themeStore.ts
 * Global presentation theme — colors, typography, and named presets.
 * Intentionally kept separate from slidesStore so theme changes do NOT
 * push undo-history snapshots (themes are a "live" design system setting).
 */
'use client'

import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  primary:    string   // main brand / accent color
  secondary:  string   // secondary brand color
  text:       string   // default body text color
  background: string   // slide canvas default bg
  accent:     string   // highlight / call-to-action color
}

export interface ThemeTypography {
  headingFont: string  // font family name (must exist in ALL_FONTS)
  bodyFont:    string
}

export interface PresentationTheme {
  id:         string
  name:       string
  colors:     ThemeColors
  typography: ThemeTypography
}

export interface ThemeState {
  activeTheme: PresentationTheme

  /** Replace the entire active theme with a preset */
  setTheme(preset: PresentationTheme): void

  /** Update a single color token */
  updateColor(key: keyof ThemeColors, value: string): void

  /** Update a single typography token */
  updateTypography(key: keyof ThemeTypography, value: string): void
}

// ─── Built-in Presets ─────────────────────────────────────────────────────────

export const THEME_PRESETS: PresentationTheme[] = [
  {
    id: 'light',
    name: 'Light',
    colors: {
      primary:    '#6366f1',
      secondary:  '#8b5cf6',
      text:       '#1f2937',
      background: '#ffffff',
      accent:     '#f59e0b',
    },
    typography: { headingFont: 'Inter', bodyFont: 'Inter' },
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      primary:    '#818cf8',
      secondary:  '#a78bfa',
      text:       '#f1f5f9',
      background: '#0f172a',
      accent:     '#fbbf24',
    },
    typography: { headingFont: 'Inter', bodyFont: 'Inter' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      primary:    '#0ea5e9',
      secondary:  '#06b6d4',
      text:       '#f0f9ff',
      background: '#0c4a6e',
      accent:     '#38bdf8',
    },
    typography: { headingFont: 'Poppins', bodyFont: 'Poppins' },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary:    '#22c55e',
      secondary:  '#16a34a',
      text:       '#f0fdf4',
      background: '#14532d',
      accent:     '#4ade80',
    },
    typography: { headingFont: 'Montserrat', bodyFont: 'Roboto' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      primary:    '#f97316',
      secondary:  '#ef4444',
      text:       '#fff7ed',
      background: '#7c2d12',
      accent:     '#fb923c',
    },
    typography: { headingFont: 'Raleway', bodyFont: 'Open Sans' },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    colors: {
      primary:    '#2563eb',
      secondary:  '#1d4ed8',
      text:       '#111827',
      background: '#f9fafb',
      accent:     '#0ea5e9',
    },
    typography: { headingFont: 'Roboto', bodyFont: 'Roboto' },
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────

export const useThemeStore = create<ThemeState>((set) => ({
  activeTheme: THEME_PRESETS[0],  // default: Light

  setTheme(preset) {
    set({ activeTheme: preset })
  },

  updateColor(key, value) {
    set(s => ({
      activeTheme: {
        ...s.activeTheme,
        colors: { ...s.activeTheme.colors, [key]: value },
      },
    }))
  },

  updateTypography(key, value) {
    set(s => ({
      activeTheme: {
        ...s.activeTheme,
        typography: { ...s.activeTheme.typography, [key]: value },
      },
    }))
  },
}))
