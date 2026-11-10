package io.horizontalsystems.bankwallet.modules.intro

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.Composable
import io.horizontalsystems.bankwallet.core.BaseActivity
import io.horizontalsystems.bankwallet.modules.main.MainModule
import io.horizontalsystems.bankwallet.modules.noaccount.AccountEntryContent
import io.horizontalsystems.bankwallet.ui.compose.ComposeAppTheme

class IntroActivity : BaseActivity() {

    private val viewModel by viewModels<IntroViewModel> { IntroModule.Factory() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            ComposeAppTheme {
                IntroScreen(
                    onRecoverAccount = {
                        viewModel.onActionSelected()
                        MainModule.start(this, MainModule.StartupDestination.RecoveryAccount)
                        finish()
                    }
                )
            }
        }
    }

    companion object {
        fun start(context: Context) {
            val intent = Intent(context, IntroActivity::class.java)
            context.startActivity(intent)
        }
    }

}

@Composable
private fun IntroScreen(
    onRecoverAccount: () -> Unit,
) {
    AccountEntryContent(
        onRecoverAccount = onRecoverAccount,
    )
}
