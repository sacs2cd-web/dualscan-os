package io.horizontalsystems.bankwallet.modules.balance.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavController
import io.horizontalsystems.bankwallet.R
import io.horizontalsystems.bankwallet.core.slideFromRight
import io.horizontalsystems.bankwallet.core.stats.StatEvent
import io.horizontalsystems.bankwallet.core.stats.StatPage
import io.horizontalsystems.bankwallet.core.stats.stat
import io.horizontalsystems.bankwallet.modules.manageaccounts.ManageAccountsModule
import io.horizontalsystems.bankwallet.modules.noaccount.AccountEntryContent

@Composable
fun BalanceNoAccount(navController: NavController) {
    AccountEntryContent(
        onRecoverAccount = {
            navController.slideFromRight(
                R.id.restoreAccountFragment,
                ManageAccountsModule.Input(
                    popOffOnSuccess = R.id.restoreAccountFragment,
                    popOffInclusive = true
                )
            )

            stat(page = StatPage.Balance, event = StatEvent.Open(StatPage.ImportWallet))
        }
    )
}
