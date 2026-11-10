package io.horizontalsystems.bankwallet.modules.receive.ui

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import io.horizontalsystems.bankwallet.R
import io.horizontalsystems.bankwallet.core.stats.StatEntity
import io.horizontalsystems.bankwallet.core.stats.StatEvent
import io.horizontalsystems.bankwallet.core.stats.StatPage
import io.horizontalsystems.bankwallet.core.stats.stat
import io.horizontalsystems.bankwallet.entities.ViewState
import io.horizontalsystems.bankwallet.modules.coin.overview.ui.Loading
import io.horizontalsystems.bankwallet.modules.receive.ReceiveModule
import io.horizontalsystems.bankwallet.ui.compose.ComposeAppTheme
import io.horizontalsystems.bankwallet.ui.compose.TranslatableString
import io.horizontalsystems.bankwallet.ui.compose.components.ErrorScreenWithAction
import io.horizontalsystems.bankwallet.ui.compose.components.HsTextButton
import io.horizontalsystems.bankwallet.ui.compose.components.MenuItem
import io.horizontalsystems.bankwallet.ui.compose.components.TextImportantError
import io.horizontalsystems.bankwallet.ui.compose.components.TextImportantWarning
import io.horizontalsystems.bankwallet.ui.compose.components.VSpacer
import io.horizontalsystems.bankwallet.ui.compose.components.captionSB_jacob
import io.horizontalsystems.bankwallet.ui.compose.components.caption_grey
import io.horizontalsystems.bankwallet.ui.compose.components.subhead2_leah
import io.horizontalsystems.bankwallet.ui.compose.components.subhead_grey
import io.horizontalsystems.bankwallet.ui.helpers.TextHelper
import io.horizontalsystems.bankwallet.uiv3.components.HSScaffold
import io.horizontalsystems.bankwallet.uiv3.components.controls.ButtonVariant
import io.horizontalsystems.bankwallet.uiv3.components.controls.HSIconButton
import io.horizontalsystems.core.helpers.HudHelper


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReceiveAddressScreen(
    title: String,
    uiState: ReceiveModule.AbstractUiState,
    onErrorClick: () -> Unit = {},
    slot1: @Composable () -> Unit = {},
    onBackPress: () -> Unit,
    closeModule: (() -> Unit)? = null,
) {
    val localView = LocalView.current

    HSScaffold(
        title = title,
        onBack = onBackPress,
        menuItems = if (closeModule == null) emptyList() else listOf(
            MenuItem(
                title = TranslatableString.ResString(R.string.Button_Done),
                icon = R.drawable.ic_close,
                onClick = closeModule
            )
        )
    ) {
        Crossfade(uiState.viewState, label = "") { viewState ->
            Column {
                when (viewState) {
                    is ViewState.Error -> {
                        ErrorScreenWithAction(
                            text = stringResource(R.string.SyncError),
                            icon = R.drawable.ic_warning_64,
                        ) {
                            HsTextButton(
                                onClick = onErrorClick,
                            ) {
                                captionSB_jacob(
                                    text = stringResource(R.string.Button_Retry),
                                )
                            }
                        }
                    }

                    ViewState.Loading -> {
                        Loading()
                    }

                    ViewState.Success -> {
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth()
                                .verticalScroll(rememberScrollState()),
                        ) {
                            VSpacer(12.dp)
                            uiState.alertText?.let {
                                WarningTextView(it)
                            }

                            if (uiState.watchAccount) {
                                TextImportantWarning(
                                    modifier = Modifier.padding(horizontal = 16.dp),
                                    text = stringResource(R.string.Balance_Receive_WatchAddressAlert),
                                )
                            }

                            VSpacer(12.dp)
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(ComposeAppTheme.colors.lawrence),
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            TextHelper.copyText(uiState.uri)
                                            HudHelper.showSuccessMessage(
                                                localView,
                                                R.string.Hud_Text_Copied
                                            )

                                            stat(
                                                page = StatPage.Receive,
                                                event = StatEvent.Copy(StatEntity.ReceiveAddress)
                                            )
                                        },
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                ) {
                                    VSpacer(32.dp)
                                    subhead2_leah(
                                        modifier = Modifier.padding(horizontal = 46.dp),
                                        text = uiState.address,
                                        textAlign = TextAlign.Center,
                                    )

                                    val testNetBadge =
                                        if (!uiState.mainNet) " (TestNet)" else ""
                                    uiState.blockchainName?.let { blockchainName ->
                                        VSpacer(12.dp)
                                        subhead_grey(
                                            modifier = Modifier.padding(horizontal = 46.dp),
                                            text = stringResource(R.string.Balance_Network) + ": " + blockchainName + testNetBadge,
                                            textAlign = TextAlign.Center,
                                        )
                                    }
                                    uiState.addressFormat?.let { addressFormat ->
                                        VSpacer(12.dp)
                                        subhead_grey(
                                            modifier = Modifier.padding(horizontal = 46.dp),
                                            text = stringResource(R.string.Balance_Format) + ": " + addressFormat + testNetBadge,
                                            textAlign = TextAlign.Center,
                                        )
                                    }
                                    uiState.addressType?.let { addressType ->
                                        VSpacer(12.dp)
                                        subhead_grey(
                                            modifier = Modifier.padding(horizontal = 46.dp),
                                            text = stringResource(R.string.Balance_Receive_AddressType) + ": " + addressType + testNetBadge,
                                            textAlign = TextAlign.Center,
                                        )
                                    }
                                    VSpacer(32.dp)
                                }

                                slot1.invoke()
                            }

                            VSpacer(24.dp)

                            ActionButtonsRow(
                                uri = uiState.uri,
                            )

                            VSpacer(32.dp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WarningTextView(
    alertText: ReceiveModule.AlertText
) {
    when (alertText) {
        is ReceiveModule.AlertText.Critical -> {
            TextImportantError(
                modifier = Modifier.padding(horizontal = 16.dp),
                text = alertText.content,
            )
        }
    }
}

@Composable
private fun ActionButtonsRow(
    uri: String,
) {
    val localView = LocalView.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 32.dp),
        horizontalArrangement = Arrangement.Center,
    ) {
        ReceiveActionButton(
            icon = R.drawable.ic_copy_24px,
            buttonText = stringResource(R.string.Button_Copy),
            onClick = {
                TextHelper.copyText(uri)
                HudHelper.showSuccessMessage(localView, R.string.Hud_Text_Copied)

                stat(page = StatPage.Receive, event = StatEvent.Copy(StatEntity.ReceiveAddress))
            },
        )
    }
}

@Composable
private fun ReceiveActionButton(
    icon: Int,
    buttonText: String,
    onClick: () -> Unit,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        HSIconButton(
            variant = ButtonVariant.Secondary,
            onClick = onClick,
            icon = painterResource(icon),
        )
        caption_grey(
            modifier = Modifier.padding(top = 8.dp),
            text = buttonText,
            textAlign = TextAlign.Center,
        )
    }
}
