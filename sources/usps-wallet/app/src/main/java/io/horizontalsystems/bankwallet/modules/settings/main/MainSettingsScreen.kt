package io.horizontalsystems.bankwallet.modules.settings.main

import android.content.Context
import android.content.Intent
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Icon
import androidx.compose.material.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import io.horizontalsystems.bankwallet.BuildConfig
import io.horizontalsystems.bankwallet.R
import io.horizontalsystems.bankwallet.core.App
import io.horizontalsystems.bankwallet.core.managers.RateAppManager
import io.horizontalsystems.bankwallet.core.providers.Translator
import io.horizontalsystems.bankwallet.core.slideFromBottom
import io.horizontalsystems.bankwallet.core.slideFromRight
import io.horizontalsystems.bankwallet.core.stats.StatEvent
import io.horizontalsystems.bankwallet.core.stats.StatPage
import io.horizontalsystems.bankwallet.core.stats.stat
import io.horizontalsystems.bankwallet.core.wallpaper.WalletWallpaperManager
import io.horizontalsystems.bankwallet.modules.contacts.ContactsFragment
import io.horizontalsystems.bankwallet.modules.contacts.Mode
import io.horizontalsystems.bankwallet.modules.manageaccount.dialogs.BackupRequiredDialog
import io.horizontalsystems.bankwallet.modules.manageaccounts.ManageAccountsModule
import io.horizontalsystems.bankwallet.modules.settings.banners.DonateBanner
import io.horizontalsystems.bankwallet.modules.settings.main.ui.BannerCarousel
import io.horizontalsystems.bankwallet.modules.walletconnect.WCAccountTypeNotSupportedDialog
import io.horizontalsystems.bankwallet.modules.walletconnect.WCManager
import io.horizontalsystems.bankwallet.ui.compose.ComposeAppTheme
import io.horizontalsystems.bankwallet.ui.compose.components.AppBar
import io.horizontalsystems.bankwallet.ui.compose.components.BadgeText
import io.horizontalsystems.bankwallet.ui.compose.components.CellSingleLineLawrenceSection
import io.horizontalsystems.bankwallet.ui.compose.components.CellUniversalLawrenceSection
import io.horizontalsystems.bankwallet.ui.compose.components.RowUniversal
import io.horizontalsystems.bankwallet.ui.compose.components.VSpacer
import io.horizontalsystems.bankwallet.ui.compose.components.body_leah
import io.horizontalsystems.bankwallet.ui.compose.components.caption_grey
import io.horizontalsystems.bankwallet.ui.compose.components.subhead1_grey
import io.horizontalsystems.bankwallet.ui.helpers.LinkHelper

@Composable
fun SettingsScreen(
    navController: NavController,
    viewModel: MainSettingsViewModel = viewModel(factory = MainSettingsModule.Factory()),
) {

    Surface(
        color = ComposeAppTheme.colors.tyler
    ) {
        Column {
            AppBar(
                stringResource(R.string.Settings_Title),
            )

            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .windowInsetsPadding(WindowInsets.navigationBars)
            ) {
                Spacer(modifier = Modifier.height(12.dp))
                SettingSections(
                    viewModel = viewModel,
                    navController = navController,
                    )
                SettingsFooter()
                VSpacer(70.dp)
            }
        }
    }
}

@Composable
private fun SettingSections(
    viewModel: MainSettingsViewModel,
    navController: NavController,
) {
    val uiState = viewModel.uiState
    val context = LocalContext.current
    val isFDroidBuild = BuildConfig.FDROID_BUILD

    if (isFDroidBuild) {
        BannerCarousel(
            banners = listOf {
                DonateBanner(
                    onClick = {
                        navController.slideFromBottom(R.id.whyDonateFragment)
                    }
                )
            }
        )
    }

    CellUniversalLawrenceSection(
        listOf({
            HsSettingCell(
                R.string.SettingsSecurity_ManageKeys,
                R.drawable.wallet_24,
                showAlert = uiState.manageWalletShowAlert,
                onClick = {
                    navController.slideFromRight(
                        R.id.manageAccountsFragment,
                        ManageAccountsModule.Mode.Manage
                    )

                    stat(page = StatPage.Settings, event = StatEvent.Open(StatPage.ManageWallets))
                }
            )
        }, {
            HsSettingCell(
                R.string.BlockchainSettings_Title,
                R.drawable.box_24,
                onClick = {
                    navController.slideFromRight(R.id.blockchainSettingsFragment)

                    stat(
                        page = StatPage.Settings,
                        event = StatEvent.Open(StatPage.BlockchainSettings)
                    )
                }
            )
        }, {
            HsSettingCell(
                R.string.Settings_SecurityCenter,
                R.drawable.shield_24,
                showAlert = uiState.securityCenterShowAlert,
                onClick = {
                    navController.slideFromRight(R.id.securitySettingsFragment)

                    stat(page = StatPage.Settings, event = StatEvent.Open(StatPage.Security))
                }
            )
        }, {
            HsSettingCell(
                R.string.DAppConnection_Title,
                R.drawable.link_24,
                value = (uiState.wcCounterType as? MainSettingsModule.CounterType.SessionCounter)?.number?.toString(),
                counterBadge = (uiState.wcCounterType as? MainSettingsModule.CounterType.PendingRequestCounter)?.number?.toString(),
                onClick = {
                    when (val state = viewModel.walletConnectSupportState) {
                        WCManager.SupportState.Supported -> {
                            navController.slideFromRight(R.id.wcListFragment)

                            stat(
                                page = StatPage.Settings,
                                event = StatEvent.Open(StatPage.WalletConnect)
                            )
                        }

                        WCManager.SupportState.NotSupportedDueToNoActiveAccount -> {
                            navController.slideFromBottom(R.id.wcErrorNoAccountFragment)
                        }

                        is WCManager.SupportState.NotSupportedDueToNonBackedUpAccount -> {
                            val text = Translator.getString(R.string.WalletConnect_Error_NeedBackup)
                            navController.slideFromBottom(
                                R.id.backupRequiredDialog,
                                BackupRequiredDialog.Input(state.account, text)
                            )

                            stat(
                                page = StatPage.Settings,
                                event = StatEvent.Open(StatPage.BackupRequired)
                            )
                        }

                        is WCManager.SupportState.NotSupported -> {
                            navController.slideFromBottom(
                                R.id.wcAccountTypeNotSupportedDialog,
                                WCAccountTypeNotSupportedDialog.Input(state.accountTypeDescription)
                            )
                        }
                    }
                }
            )
        }, {
            HsSettingCell(
                R.string.WalletMode_SetDeviceWallpaper,
                R.drawable.ic_gallery_24,
                onClick = {
                    WalletWallpaperManager.openWallpaperSettings(context)
                }
            )
        },
//            {
//            HsSettingCell(
//                title = R.string.Settings_TonConnect,
//                icon = R.drawable.ic_ton_connect_24,
//                value = null,
//                counterBadge = null,
//                onClick = {
//                    navController.slideFromRight(R.id.tcListFragment)
//
//                    stat(
//                        page = StatPage.Settings,
//                        event = StatEvent.Open(StatPage.TonConnect)
//                    )
//                }
//            )
//        }
        )
    )

    VSpacer(24.dp)

    CellUniversalLawrenceSection(
        buildList {
            add {
                HsSettingCell(
                    R.string.Contacts,
                    R.drawable.user_24,
                    onClick = {
                        navController.slideFromRight(
                            R.id.contactsFragment,
                            ContactsFragment.Input(Mode.Full)
                        )

                        stat(page = StatPage.Settings, event = StatEvent.Open(StatPage.Contacts))
                    }
                )
            }
        }
    )

    VSpacer(24.dp)

    CellUniversalLawrenceSection(
        buildList {
            add {
                HsSettingCell(
                    R.string.BackupManager_Title,
                    R.drawable.file_24,
                    onClick = {
                        navController.slideFromRight(R.id.backupManagerFragment)

                        stat(
                            page = StatPage.Settings,
                            event = StatEvent.Open(StatPage.BackupManager)
                        )
                    }
                )
            }
        }
    )

    VSpacer(32.dp)
}

@Composable
fun HsSettingCell(
    @StringRes title: Int,
    @DrawableRes icon: Int,
    iconTint: Color? = null,
    value: String? = null,
    counterBadge: String? = null,
    showAlert: Boolean = false,
    onClick: () -> Unit
) {
    RowUniversal(
        modifier = Modifier.padding(horizontal = 16.dp),
        onClick = onClick
    ) {
        Icon(
            modifier = Modifier.size(24.dp),
            painter = painterResource(id = icon),
            contentDescription = null,
            tint = iconTint ?: ComposeAppTheme.colors.grey
        )
        body_leah(
            text = stringResource(title),
            maxLines = 1,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Spacer(Modifier.weight(1f))

        if (counterBadge != null) {
            BadgeText(
                modifier = Modifier.padding(horizontal = 8.dp),
                text = counterBadge
            )
        } else if (value != null) {
            subhead1_grey(
                text = value,
                maxLines = 1,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }

        if (showAlert) {
            Image(
                modifier = Modifier.size(20.dp),
                painter = painterResource(id = R.drawable.ic_attention_red_20),
                contentDescription = null,
            )
            Spacer(Modifier.width(12.dp))
        }
        Image(
            modifier = Modifier.size(20.dp),
            painter = painterResource(id = R.drawable.ic_arrow_right),
            contentDescription = null,
        )
    }
}

@Composable
private fun SettingsFooter() {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        caption_grey(
            text = stringResource(R.string.Settings_InfoTitleWithVersion)
        )
        caption_grey(
            modifier = Modifier.padding(top = 12.dp, bottom = 32.dp),
            text = stringResource(R.string.Settings_FooterCredit),
        )
    }
}

private fun shareAppLink(appLink: String, context: Context) {
    val shareMessage = Translator.getString(R.string.SettingsShare_Text) + "\n" + appLink + "\n"
    val shareIntent = Intent(Intent.ACTION_SEND)
    shareIntent.type = "text/plain"
    shareIntent.putExtra(Intent.EXTRA_TEXT, shareMessage)
    context.startActivity(
        Intent.createChooser(
            shareIntent,
            Translator.getString(R.string.SettingsShare_Title)
        )
    )
}

@Preview
@Composable
private fun previewSettingsScreen() {
    ComposeAppTheme {
        Column {
            CellSingleLineLawrenceSection(
                listOf({
                    HsSettingCell(
                        R.string.Settings_Faq,
                        R.drawable.ic_faq_20,
                        showAlert = true,
                        onClick = { }
                    )
                }, {
                    HsSettingCell(
                        R.string.Guides_Title,
                        R.drawable.ic_academy_20,
                        onClick = { }
                    )
                })
            )

            Spacer(Modifier.height(32.dp))

            CellSingleLineLawrenceSection(
                listOf {
                    HsSettingCell(
                        R.string.Settings_WalletConnect,
                        R.drawable.ic_wallet_connect_20,
                        counterBadge = "13",
                        onClick = { }
                    )
                }
            )
        }
    }
}
