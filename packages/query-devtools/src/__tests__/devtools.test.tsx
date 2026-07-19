import { QueryClient, onlineManager } from '@tanstack/query-core'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DevtoolsComponent from '../DevtoolsComponent'

describe('TanstackQueryDevtools', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })

  afterEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('hides disabled queries when configured and reacts to updates', async () => {
    const client = new QueryClient()
    client.getQueryCache().build(client, {
      queryKey: ['disabled-witness'],
      queryFn: () => Promise.resolve('unused'),
    })
    client.setQueryData(['visible-witness'], 'visible')
    const root = document.body.appendChild(document.createElement('div'))
    const [hideDisabledQueries, setHideDisabledQueries] = createSignal(true)
    const dispose = render(
      () => (
        <DevtoolsComponent
          client={client}
          queryFlavor="Query"
          version="5"
          onlineManager={onlineManager}
          initialIsOpen
          hideDisabledQueries={hideDisabledQueries()}
        />
      ),
      root,
    )

    const queryRow = (hash: string) =>
      root.querySelector(`[aria-label='Query key ["${hash}"]']`)
    await vi.waitFor(() => expect(queryRow('visible-witness')).not.toBeNull())
    expect(queryRow('disabled-witness')).toBeNull()

    setHideDisabledQueries(false)
    await vi.waitFor(() => expect(queryRow('disabled-witness')).not.toBeNull())

    dispose()
    client.clear()
  })
})
