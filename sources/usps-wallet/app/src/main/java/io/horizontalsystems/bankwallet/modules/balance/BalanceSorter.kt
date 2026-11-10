package io.horizontalsystems.bankwallet.modules.balance

import io.horizontalsystems.bankwallet.core.DigitalDebitAssetCatalog
import io.horizontalsystems.bankwallet.core.diff
import io.horizontalsystems.bankwallet.core.order
import java.math.BigDecimal

class BalanceSorter {

    fun sort(items: Iterable<BalanceModule.BalanceItem>, sortType: BalanceSortType): List<BalanceModule.BalanceItem> {
        return when (sortType) {
            BalanceSortType.Value -> sortByBalance(items)
            BalanceSortType.Name -> items.sortedWith(
                pinnedAssetsComparator()
                    .thenBy { DigitalDebitAssetCatalog.displayCode(it.wallet.token) }
            )
            BalanceSortType.PercentGrowth -> items.sortedWith(
                pinnedAssetsComparator()
                    .thenByDescending { it.coinPrice?.diff }
            )
        }
    }

    private fun pinnedAssetsComparator() =
        compareBy<BalanceModule.BalanceItem>(
            { if (DigitalDebitAssetCatalog.isSupported(it.wallet.token)) 0 else 1 },
            { DigitalDebitAssetCatalog.sortRank(it.wallet.token) }
        )

    private fun sortByBalance(items: Iterable<BalanceModule.BalanceItem>): List<BalanceModule.BalanceItem> {
        val comparator =
                pinnedAssetsComparator().thenByDescending {
                    it.balanceData.total > BigDecimal.ZERO
                }.thenByDescending {
                    (it.balanceFiatTotal ?: BigDecimal.ZERO) > BigDecimal.ZERO
                }.thenByDescending {
                    it.balanceFiatTotal
                }.thenByDescending {
                    it.balanceData.total
                }.thenBy {
                    it.wallet.token.blockchainType.order
                }.thenBy {
                    it.wallet.coin.name
                }

        return items.sortedWith(comparator)
    }
}
