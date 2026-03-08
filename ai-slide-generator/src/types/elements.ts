/**
 * Canonical SlideElement discriminated union — Media & Visuals Engine
 * All element types that can live inside a slide's elements[] array.
 */

// ─── Base fields shared by every element ───────────────────────────────────────
export interface BaseElement {
  id: string
  x: number       // px from slide left
  y: number       // px from slide top
  width?: number  // px
  height?: number // px
  rotation?: number  // degrees
  opacity?: number   // 0–1
  locked?: boolean
  visible?: boolean  // false = hidden in editor (not exported)
}

// ─── Group ────────────────────────────────────────────────────────────────────
export interface GroupElement extends BaseElement {
  type: 'group'
  childIds: string[]  // ordered IDs of child elements (back → front)
}

// ─── Text ────────────────────────────────────────────────────────────────────
export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  fontSize?: number
  color?: string
  background?: string
  align?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  language?: string
  lineHeight?: number
  letterSpacing?: number
  textShadow?: string
  textStroke?: string
  textColumns?: 1 | 2 | 3
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  heightLocked?: boolean
}

// ─── Math formula (KaTeX) ────────────────────────────────────────────────────
export interface FormulaElement extends BaseElement {
  type: 'formula'
  content: string  // LaTeX string
}

// ─── Code block ─────────────────────────────────────────────────────────────
export interface CodeElement extends BaseElement {
  type: 'code'
  content: string
  language?: string
}

// ─── Image ───────────────────────────────────────────────────────────────────
export interface ImageFilter {
  brightness?: number    // 0–200 (default 100)
  contrast?: number      // 0–200
  saturation?: number    // 0–200
  blur?: number          // px (0–20)
}

export type MaskShape = 'none' | 'circle' | 'star' | 'hexagon' | 'diamond' | 'device-iphone' | 'device-browser'

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string             // CDN URL or data URL
  alt?: string
  maskShape?: MaskShape
  maskImageX?: number     // translate-X of image inside mask (px, relative)
  maskImageY?: number     // translate-Y of image inside mask (px, relative)
  maskImageScale?: number // zoom of image inside mask (default 1)
  filters?: ImageFilter
  borderRadius?: number
  croppedAspect?: '1:1' | '16:9' | '4:3' | 'free'
  objectFit?: 'cover' | 'contain' | 'fill'
}

// ─── Smart Shape ─────────────────────────────────────────────────────────────
export type ShapeKind =
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'arrow-right'
  | 'arrow-left'
  | 'line'
  | 'star'
  | 'hexagon'
  | 'diamond'
  | 'cloud'
  | 'speech-bubble'

export type StrokeStyle = 'solid' | 'dashed' | 'dotted'
export type FillType = 'solid' | 'gradient'

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shapeKind: ShapeKind
  fillType: FillType
  fill: string               // hex or gradient CSS string
  fillGradientEnd?: string   // second color for gradient
  fillGradientAngle?: number // gradient angle degrees
  stroke?: string            // hex
  strokeWidth?: number       // px
  strokeStyle?: StrokeStyle
  borderRadius?: number      // for rect (px)
  arrowHeadSize?: number     // for arrow shapes (% of width)
  // Embedded text
  text?: string
  textColor?: string
  textFontSize?: number
  textAlign?: 'left' | 'center' | 'right'
  textBold?: boolean
  textItalic?: boolean
}

// ─── SVG Icon ─────────────────────────────────────────────────────────────────
export interface IconElement extends BaseElement {
  type: 'icon'
  iconName: string      // Lucide icon component name
  color: string         // hex fill/stroke color
  size: number          // px (width = height)
  strokeWidth?: number  // lucide stroke-width prop (default 2)
}

// ─── Video / GIF ─────────────────────────────────────────────────────────────
export type VideoType = 'gif' | 'youtube' | 'vimeo'

export interface VideoElement extends BaseElement {
  type: 'video'
  videoType: VideoType
  src: string           // original URL (GIF url or YouTube/Vimeo page url)
  thumbnailUrl?: string // fetched thumbnail for editor display
  embedUrl?: string     // computed iframe src (YouTube embed / Vimeo embed)
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
}

// ─── Discriminated union ──────────────────────────────────────────────────────
export type SlideElement =
  | TextElement
  | FormulaElement
  | CodeElement
  | ImageElement
  | ShapeElement
  | IconElement
  | VideoElement
  | GroupElement

// ─── Type guards ──────────────────────────────────────────────────────────────
export const isText    = (el: SlideElement): el is TextElement    => el.type === 'text'
export const isFormula = (el: SlideElement): el is FormulaElement => el.type === 'formula'
export const isCode    = (el: SlideElement): el is CodeElement    => el.type === 'code'
export const isImage   = (el: SlideElement): el is ImageElement   => el.type === 'image'
export const isShape   = (el: SlideElement): el is ShapeElement   => el.type === 'shape'
export const isIcon    = (el: SlideElement): el is IconElement    => el.type === 'icon'
export const isVideo   = (el: SlideElement): el is VideoElement   => el.type === 'video'
export const isGroup   = (el: SlideElement): el is GroupElement   => el.type === 'group'

// ─── Slide Background ────────────────────────────────────────────────────────

/** Rich background descriptor for a single slide. */
export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image'
  /** hex string (solid), CSS gradient string (gradient), or image URL (image) */
  value: string
  /** Overlay color drawn on top of image backgrounds for readability */
  overlayColor?: string   // default '#000000'
  /** 0 = fully transparent, 1 = fully opaque */
  overlayOpacity?: number // default 0
}

// ─── Slide ────────────────────────────────────────────────────────────────────

export type SlideLayoutType = 'blank' | 'title' | 'title-body' | 'two-column' | 'image-text' | 'section-header'

export interface Slide {
  /** Stable UUID — assigned to every slide on creation/migration */
  id: string
  title: string
  elements: SlideElement[]
  image?: string
  /** Structured background (preferred). Falls back to legacy `background` string. */
  bg?: SlideBackground
  /** @deprecated Use `bg` instead. Kept for backward-compat with existing DB rows. */
  background?: string
  backgroundImage?: string
  titleColor?: string
  style?: { titleSize?: number; fontFamily?: string; _fontFamily?: string }
  /** Presenter/Speaker notes for this slide */
  speakerNotes?: string
  /** If true the slide is skipped in Presentation (Play) mode */
  isHidden?: boolean
  /** Initial layout template used when the slide was created */
  layoutType?: SlideLayoutType
}

// ─── Default factories ────────────────────────────────────────────────────────
export function makeId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function defaultImageElement(overrides?: Partial<ImageElement>): ImageElement {
  return {
    id: makeId(), type: 'image',
    x: 40, y: 120, width: 400, height: 280,
    src: '',
    maskShape: 'none',
    maskImageScale: 1,
    filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
    objectFit: 'cover',
    ...overrides,
  }
}

export function defaultShapeElement(overrides?: Partial<ShapeElement>): ShapeElement {
  return {
    id: makeId(), type: 'shape',
    x: 100, y: 140, width: 240, height: 160,
    shapeKind: 'rect',
    fillType: 'solid',
    fill: '#6366f1',
    stroke: undefined,
    strokeWidth: 0,
    strokeStyle: 'solid',
    borderRadius: 12,
    text: '',
    textColor: '#ffffff',
    textFontSize: 20,
    textAlign: 'center',
    textBold: false,
    ...overrides,
  }
}

export function defaultIconElement(overrides?: Partial<IconElement>): IconElement {
  return {
    id: makeId(), type: 'icon',
    x: 100, y: 140, width: 80, height: 80,
    iconName: 'Star',
    color: '#6366f1',
    size: 64,
    strokeWidth: 2,
    ...overrides,
  }
}

export function defaultVideoElement(overrides?: Partial<VideoElement>): VideoElement {
  return {
    id: makeId(), type: 'video',
    x: 80, y: 120, width: 480, height: 270,
    videoType: 'youtube',
    src: '',
    ...overrides,
  }
}
