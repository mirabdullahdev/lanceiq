import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Momentum scrolling.
 *
 * This is doing perceptual work as much as technical: native wheel scrolling
 * moves in coarse discrete jumps, and any frame the page drops during one of
 * those jumps reads as a stutter. Interpolating between them means a dropped
 * frame lands between two interpolated positions instead of between two
 * lurches, so the same frame rate simply feels smoother.
 *
 * Lenis drives its own rAF loop and writes a single transform per frame, so
 * it costs one composited property update — not layout, not paint.
 */
export function useSmoothScroll() {
  useEffect(() => {
    // Anyone who has asked the OS for less motion gets native scrolling.
    // Hijacking the scrollbar is exactly what that setting is about.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      // ~0.9s to settle. Long enough to feel weighted, short enough that the
      // page still answers the wheel immediately.
      duration: 0.9,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      // Touch devices already have excellent native momentum, and overriding
      // it fights the platform and feels wrong on iOS.
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    })

    let frame = 0
    const raf = (t: number) => {
      lenis.raf(t)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    /* In-page anchors have to go through Lenis, or the browser's native jump
       fights the interpolated position and the page ends up somewhere else. */
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]')
      if (!link) return
      const href = link.getAttribute('href')
      if (!href || href === '#') return
      const target = document.querySelector(href)
      if (!target) return
      e.preventDefault()
      // Matches scroll-padding-top so headings clear the fixed header.
      lenis.scrollTo(target as HTMLElement, { offset: -96 })
    }

    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])
}
