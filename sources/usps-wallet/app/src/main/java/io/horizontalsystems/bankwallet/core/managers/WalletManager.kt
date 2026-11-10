package io.horizontalsystems.bankwallet.core.managers

import io.horizontalsystems.bankwallet.core.App
import io.horizontalsystems.bankwallet.core.DigitalDebitAssetCatalog
import io.horizontalsystems.bankwallet.core.IAccountManager
import io.horizontalsystems.bankwallet.core.IWalletStorage
import io.horizontalsystems.bankwallet.entities.Account
import io.horizontalsystems.bankwallet.entities.EnabledWallet
import io.horizontalsystems.bankwallet.entities.Wallet
import io.horizontalsystems.marketkit.models.BlockchainType
import io.reactivex.subjects.PublishSubject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.rx2.asFlow

class WalletManager(
    private val accountManager: IAccountManager,
    private val storage: IWalletStorage,
) {

    val activeWallets get() = walletsSet.toList()
    val activeWalletsUpdatedObservable = PublishSubject.create<List<Wallet>>()

    private val walletsSet = mutableSetOf<Wallet>()
    private val coroutineScope = CoroutineScope(Dispatchers.IO)

    init {
        coroutineScope.launch {
            accountManager.activeAccountStateFlow.collect { activeAccountState ->
                if (activeAccountState is ActiveAccountState.ActiveAccount) {
                    handleUpdated(activeAccountState.account)
                }
            }
        }
    }

    fun save(wallets: List<Wallet>) {
        handle(wallets, listOf())
    }

    fun delete(wallets: List<Wallet>) {
        handle(listOf(), wallets)
    }

    @Synchronized
    fun handle(newWallets: List<Wallet>, deletedWallets: List<Wallet>) {
        val supportedNewWallets = newWallets.filter { DigitalDebitAssetCatalog.isSupported(it.token) }
        val deletableWallets = deletedWallets.filterNot { DigitalDebitAssetCatalog.isCore(it.token) }

        storage.save(supportedNewWallets)
        storage.delete(deletableWallets)

        val activeAccount = accountManager.activeAccount
        walletsSet.addAll(supportedNewWallets.filter { it.account == activeAccount })
        walletsSet.removeAll(deletableWallets)
        notifyActiveWallets()
    }

    fun clear() {
        storage.clear()
        walletsSet.clear()
        notifyActiveWallets()
        coroutineScope.cancel()
    }

    private fun notifyActiveWallets() {
        activeWalletsUpdatedObservable.onNext(walletsSet.toList())
    }

    @Synchronized
    private fun handleUpdated(activeAccount: Account?) {
        val activeWallets = activeAccount?.let { account ->
            ensureCoreWallets(account)
            storage.wallets(account).filter { wallet -> DigitalDebitAssetCatalog.isSupported(wallet.token) }
        } ?: listOf()

        setWallets(activeWallets)
        notifyActiveWallets()
    }

    private fun ensureCoreWallets(activeAccount: Account) {
        val storedWallets = storage.wallets(activeAccount)
        val storedIds = storedWallets.map { it.token.tokenQuery.id }.toSet()
        val missingCoreWallets = DigitalDebitAssetCatalog.defaultActivationTokens(App.marketKit, activeAccount.type)
            .filter { token -> token.tokenQuery.id !in storedIds }
            .map { token -> Wallet(token, activeAccount) }

        if (missingCoreWallets.isNotEmpty()) {
            storage.save(missingCoreWallets)
        }
    }

    @Synchronized
    private fun setWallets(activeWallets: List<Wallet>) {
        walletsSet.clear()
        walletsSet.addAll(activeWallets)
    }

    fun saveEnabledWallets(enabledWallets: List<EnabledWallet>) {
        storage.handle(enabledWallets.filter { DigitalDebitAssetCatalog.isSupported(it.tokenQueryId) })
        handleUpdated(accountManager.activeAccount)
    }

    fun start(
        restoreSettingsManager: RestoreSettingsManager,
        moneroNodeManager: MoneroNodeManager,
        btcBlockchainManager: BtcBlockchainManager,
        evmBlockchainManager: EvmBlockchainManager,
        solanaKitManager: SolanaKitManager,
        tronKitManager: TronKitManager,
    ) {
        coroutineScope.launch {
            restoreSettingsManager.settingsUpdatedFlow.collect { blockchainType ->
                reloadWallets(blockchainType)
            }
        }
        coroutineScope.launch {
            moneroNodeManager.currentNodeUpdatedFlow.collect {
                reloadWallets(BlockchainType.Monero)
            }
        }
        coroutineScope.launch {
            btcBlockchainManager.restoreModeUpdatedObservable.asFlow().collect { blockchainType ->
                reloadWallets(blockchainType)
            }
        }
        for (blockchain in evmBlockchainManager.allBlockchains) {
            coroutineScope.launch {
                evmBlockchainManager.getEvmKitManager(blockchain.type).evmKitUpdatedObservable.asFlow()
                    .collect {
                        reloadWallets(blockchain.type)
                    }
            }
        }
        coroutineScope.launch {
            solanaKitManager.kitStoppedObservable.asFlow().collect {
                reloadWallets(BlockchainType.Solana)
            }
        }
        coroutineScope.launch {
            tronKitManager.kitStoppedObservable.asFlow().collect {
                reloadWallets(BlockchainType.Tron)
            }
        }
    }

    @Synchronized
    private fun reloadWallets(blockchainType: BlockchainType) {
        val walletsToReAdd = walletsSet.filter { it.token.blockchainType == blockchainType }
        if (walletsToReAdd.isEmpty()) return

        delete(walletsToReAdd)
        save(walletsToReAdd)
    }

}
