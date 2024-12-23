import type { Adapter, WalletError } from '@solana/wallet-adapter-base'
import type { Ref } from 'vue'
import { SolanaMobileWalletAdapterWalletName } from '@solana-mobile/wallet-adapter-mobile'
import { watch, watchEffect } from 'vue'
import type { Wallet } from '~/types'

/**
 * Handles the wallet adapter events.
 */
export function useAdapterListeners(
  wallet: Ref<Wallet | undefined>,
  unloadingWindow: Ref<boolean>,
  isUsingMwaOnMobile: Ref<boolean>,
  deselect: (force?: boolean) => void,
  refreshWalletState: () => void,
  handleError: (error: WalletError, adapter?: Adapter) => WalletError,
) {
  // Disconnect previous wallet when selecting a new one.
  watch(wallet, (newWallet, oldWallet) => {
    const newAdapter = newWallet?.adapter
    const oldAdapter = oldWallet?.adapter
    if (!newAdapter || !oldAdapter) {
      return
    }
    if (newAdapter.name === oldAdapter.name) {
      return
    }
    if (oldAdapter.name === SolanaMobileWalletAdapterWalletName) {
      return
    }
    oldAdapter.disconnect().then()
  })

  const handleAdapterConnect = () => {
    refreshWalletState()
  }

  const handleAdapterDisconnect = () => {
    if (unloadingWindow.value || isUsingMwaOnMobile.value) {
      return
    }
    deselect(true)
  }

  // Add connect, disconnect and error listeners on the wallet adapter.
  watchEffect((onInvalidate) => {
    const adapter = wallet.value?.adapter
    if (!adapter) {
      return
    }
    const handleAdapterError = (error: WalletError): WalletError => {
      return handleError(error, adapter)
    }

    adapter.on('connect', handleAdapterConnect)
    adapter.on('disconnect', handleAdapterDisconnect)
    adapter.on('error', handleAdapterError)

    onInvalidate(() => {
      adapter.off('connect', handleAdapterConnect)
      adapter.off('disconnect', handleAdapterDisconnect)
      adapter.off('error', handleAdapterError)
    })
  })
}
