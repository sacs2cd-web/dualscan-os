package io.horizontalsystems.bankwallet.modules.noaccount

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.Icon
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import io.horizontalsystems.bankwallet.R
import io.horizontalsystems.bankwallet.ui.compose.ColoredTextStyle
import io.horizontalsystems.bankwallet.ui.compose.ComposeAppTheme
import io.horizontalsystems.bankwallet.ui.compose.components.subhead1_grey
import io.horizontalsystems.bankwallet.ui.compose.components.title3_leah

@Composable
fun AccountEntryContent(
    onRecoverAccount: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ComposeAppTheme.colors

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFFF2F7FC),
                        colors.lawrence,
                    )
                )
            )
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(32.dp),
            color = colors.lawrence,
            border = BorderStroke(1.dp, Color(0xFFD8E4F1)),
            elevation = 0.dp,
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Image(
                    modifier = Modifier.size(176.dp),
                    painter = painterResource(R.drawable.ic_usps_entry_art),
                    contentDescription = null,
                    contentScale = ContentScale.Fit,
                )

                Spacer(modifier = Modifier.height(16.dp))

                title3_leah(
                    text = stringResource(R.string.WalletEntry_Badge),
                    textAlign = TextAlign.Center,
                )

                Spacer(modifier = Modifier.height(8.dp))

                subhead1_grey(
                    text = stringResource(R.string.WalletEntry_Subtitle),
                    textAlign = TextAlign.Center,
                )
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        EntryActionCard(
            title = stringResource(R.string.ManageAccounts_ImportWallet),
            subtitle = stringResource(R.string.WalletEntry_RecoverySubtitle),
            backgroundColor = colors.lawrence,
            titleColor = colors.leah,
            subtitleColor = colors.grey,
            topAccent = colors.ocean,
            borderColor = Color(0xFFD8E4F1),
            arrowBackground = colors.lucian,
            arrowTint = colors.lawrence,
            onClick = onRecoverAccount,
        )
    }
}

@Composable
private fun EntryActionCard(
    title: String,
    subtitle: String,
    backgroundColor: Color,
    titleColor: Color,
    subtitleColor: Color,
    topAccent: Color,
    borderColor: Color,
    arrowBackground: Color,
    arrowTint: Color,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(24.dp),
        color = backgroundColor,
        border = BorderStroke(1.dp, borderColor),
        elevation = 0.dp,
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .background(topAccent)
            )

            Row(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        style = ColoredTextStyle(
                            ComposeAppTheme.typography.headline2,
                            titleColor
                        )
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = subtitle,
                        style = ColoredTextStyle(
                            ComposeAppTheme.typography.subheadR,
                            subtitleColor
                        )
                    )
                }

                Surface(
                    modifier = Modifier.size(40.dp),
                    shape = CircleShape,
                    color = arrowBackground,
                    elevation = 0.dp,
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            painter = painterResource(R.drawable.arrow_m_right_24),
                            contentDescription = null,
                            tint = arrowTint,
                        )
                    }
                }
            }
        }
    }
}
