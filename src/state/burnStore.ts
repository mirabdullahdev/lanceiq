import { useSyncExternalStore } from 'react'
import { ANNUAL_BURN_USD } from '../config/site'

/**
 * The one number shared between the problem calculator and the floating chip.
 *
 * A three-line external store rather than a context provider: the chip and the
 * calculator sit in different branches of the tree, and this avoids wrapping
 * the whole page in a provider for a single integer.
 */

type BurnState = { annual: number; touched: boolean }

let state: BurnState = { annual: ANNUAL_BURN_USD, touched: false }
const listeners = new Set<() => void>()

export function setBurn(annual: number) {
  state = { annual, touched: true }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useBurn(): BurnState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
}
