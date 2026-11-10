package io.horizontalsystems.bankwallet.core.managers

import android.content.Context
import io.horizontalsystems.bankwallet.core.IAdapterManager
import io.horizontalsystems.bankwallet.core.ILocalStorage
import io.horizontalsystems.bankwallet.core.IRateAppManager
import kotlinx.coroutines.flow.emptyFlow


class RateAppManager(
        private val walletManager: WalletManager,
        private val adapterManager: IAdapterManager,
        private val localStorage: ILocalStorage) : IRateAppManager {

    override val showRateAppFlow = emptyFlow<Boolean>()

    override fun onBalancePageActive() = Unit

    override fun onBalancePageInactive() = Unit

    override fun onAppLaunch() = Unit

    companion object {

        fun openPlayMarket(context: Context) = Unit

    }

}
