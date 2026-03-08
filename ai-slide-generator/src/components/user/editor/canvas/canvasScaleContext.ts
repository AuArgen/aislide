import { createContext, useContext } from 'react'

/**
 * Provides the current CSS transform scale factor of the slide canvas to any
 * descendant component that needs to convert between screen-pixel deltas and
 * canvas-coordinate deltas.
 *
 * Usage:
 *   const scale = useCanvasScale()
 *   const canvasDx = screenDx / scale
 */
export const CanvasScaleContext = createContext<number>(1)
export const useCanvasScale = () => useContext(CanvasScaleContext)
