package io.horizontalsystems.bankwallet.modules.qrscanner

import android.Manifest
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Rect
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview as CameraPreview
import androidx.camera.core.resolutionselector.AspectRatioStrategy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Icon
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.core.content.ContextCompat
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.PermissionStatus
import com.google.accompanist.permissions.rememberPermissionState
import com.journeyapps.barcodescanner.ScanOptions
import de.markusfisch.android.zxingcpp.ZxingCpp
import de.markusfisch.android.zxingcpp.ZxingCpp.BarcodeFormat
import de.markusfisch.android.zxingcpp.ZxingCpp.Binarizer
import io.horizontalsystems.bankwallet.R
import io.horizontalsystems.bankwallet.core.BaseActivity
import io.horizontalsystems.bankwallet.core.utils.ModuleField
import io.horizontalsystems.bankwallet.ui.compose.Bright
import io.horizontalsystems.bankwallet.ui.compose.ComposeAppTheme
import io.horizontalsystems.bankwallet.ui.compose.components.AppBar
import io.horizontalsystems.bankwallet.ui.compose.components.ButtonPrimaryDefaults
import io.horizontalsystems.bankwallet.ui.compose.components.ButtonPrimaryTransparent
import io.horizontalsystems.bankwallet.ui.compose.components.ButtonPrimaryYellow
import io.horizontalsystems.bankwallet.ui.compose.components.HsIconButton
import io.horizontalsystems.bankwallet.ui.compose.components.body_leah
import io.horizontalsystems.bankwallet.ui.compose.components.subhead2_grey
import io.horizontalsystems.bankwallet.ui.compose.components.title3_leah
import io.horizontalsystems.bankwallet.ui.helpers.TextHelper
import io.horizontalsystems.bankwallet.uiv3.components.controls.ButtonVariant
import io.horizontalsystems.bankwallet.uiv3.components.controls.HSButton
import io.horizontalsystems.core.helpers.HudHelper
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class QRScannerActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            QRScannerScreen(
                showPasteButton = intent.getBooleanExtra(SHOW_PASTE_BUTTON, false),
                allowDataMatrix = intent.getBooleanExtra(ALLOW_DATAMATRIX, false),
                onScan = { onScan(it) },
                onCloseClick = { finish() },
                onCameraPermissionSettingsClick = { openCameraPermissionSettings() }
            )
        }
    }

    private fun onScan(address: String?) {
        setResult(RESULT_OK, Intent().apply {
            putExtra(ModuleField.SCAN_ADDRESS, address)
        })
        //slow down fast transition to new window
        Handler(Looper.getMainLooper()).postDelayed({
            finish()
        }, 1000)
    }

    private fun openCameraPermissionSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
        val uri: Uri = Uri.fromParts("package", packageName, null)
        intent.data = uri
        startActivity(intent)
    }

    companion object {
        private const val SHOW_PASTE_BUTTON = "show_paste_button_key"
        private const val ALLOW_DATAMATRIX = "allow_datamatrix_key"

        fun getScanQrIntent(
            context: Context,
            showPasteButton: Boolean = false,
            allowDataMatrix: Boolean = false
        ): Intent {
            val options = ScanOptions()
            options.captureActivity = QRScannerActivity::class.java
            options.setOrientationLocked(true)
            options.setPrompt("")
            options.setBeepEnabled(false)
            options.setDesiredBarcodeFormats(listOf(ScanOptions.QR_CODE))
            val intent = options.createScanIntent(context)
            intent.putExtra(SHOW_PASTE_BUTTON, showPasteButton)
            intent.putExtra(ALLOW_DATAMATRIX, allowDataMatrix)
            return intent
        }
    }

}

private fun decodeFromUri(context: Context, uri: Uri, allowDataMatrix: Boolean): String? {
    val bitmap = context.contentResolver.openInputStream(uri)
        ?.use { BitmapFactory.decodeStream(it) } ?: return null
    return decodeBitmapWithBinaryEyeEngine(bitmap, allowDataMatrix)
}

private fun uspsScannerFormats(allowDataMatrix: Boolean) =
    if (allowDataMatrix) {
        setOf(BarcodeFormat.QRCode, BarcodeFormat.DataMatrix)
    } else {
        setOf(BarcodeFormat.QRCode)
    }

private fun binaryEyeReaderOptions(
    binarizer: Binarizer,
    allowDataMatrix: Boolean
) = ZxingCpp.ReaderOptions(
    tryHarder = true,
    tryRotate = true,
    tryInvert = true,
    tryDownscale = true,
    maxNumberOfSymbols = 1,
    textMode = ZxingCpp.TextMode.PLAIN,
    binarizer = binarizer,
    formats = uspsScannerFormats(allowDataMatrix)
)

private fun decodeBitmapWithBinaryEyeEngine(
    bitmap: Bitmap,
    allowDataMatrix: Boolean
): String? {
    return listOf(Binarizer.LOCAL_AVERAGE, Binarizer.GLOBAL_HISTOGRAM)
        .firstNotNullOfOrNull { binarizer ->
            ZxingCpp.readBitmap(
                bitmap,
                0,
                0,
                bitmap.width,
                bitmap.height,
                0,
                binaryEyeReaderOptions(binarizer, allowDataMatrix)
            )?.firstOrNull()?.text?.takeIf { it.isNotBlank() }
        }
}

private fun decodeImageProxyWithBinaryEyeEngine(
    image: ImageProxy,
    scanDelivered: AtomicBoolean,
    allowDataMatrix: Boolean
): String? {
    try {
        if (scanDelivered.get()) return null

        val yPlane = image.planes.firstOrNull() ?: return null
        val frame = Rect(0, 0, image.width, image.height)

        // USPS Wallet stays QR-only by default. DataMatrix is enabled only for
        // the Jovon USD token scanner so it remains compatible with Jovon Wallet.
        val decoded = listOf(Binarizer.LOCAL_AVERAGE, Binarizer.GLOBAL_HISTOGRAM)
            .firstNotNullOfOrNull { binarizer ->
                yPlane.buffer.rewind()
                ZxingCpp.readYBuffer(
                    yPlane.buffer,
                    yPlane.rowStride,
                    frame,
                    image.imageInfo.rotationDegrees,
                    binaryEyeReaderOptions(binarizer, allowDataMatrix)
                )?.firstOrNull()?.text?.takeIf { it.isNotBlank() }
            }

        return decoded?.takeIf {
            scanDelivered.compareAndSet(false, true)
        }
    } finally {
        image.close()
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
private fun QRScannerScreen(
    showPasteButton: Boolean,
    allowDataMatrix: Boolean,
    onScan: (String) -> Unit,
    onCloseClick: () -> Unit,
    onCameraPermissionSettingsClick: () -> Unit
) {
    val context = LocalContext.current
    val view = androidx.compose.ui.platform.LocalView.current
    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        uri ?: return@rememberLauncherForActivityResult
        val result = decodeFromUri(context, uri, allowDataMatrix)
        if (result != null) {
            HudHelper.showSuccessMessage(view, R.string.ScanQr_QrDetected)
            onScan(result)
        } else {
            HudHelper.showErrorMessage(view, R.string.ScanQr_NoQrFound)
        }
    }
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)
    var showPermissionNeededDialog by remember { mutableStateOf(cameraPermissionState.status != PermissionStatus.Granted) }

    if (showPermissionNeededDialog) {
        PermissionNeededDialog(
            onOkClick = {
                cameraPermissionState.launchPermissionRequest()
                showPermissionNeededDialog = false
            },
            onCancelClick = {
                showPermissionNeededDialog = false
            }
        )
    }

    ComposeAppTheme {
        Box(
            Modifier
                .fillMaxSize()
                .background(color = ComposeAppTheme.colors.tyler),
            contentAlignment = Alignment.Center
        ) {
            if (cameraPermissionState.status == PermissionStatus.Granted) {
                ScannerView(onScan, allowDataMatrix)
            } else {
                Spacer(
                    Modifier
                        .fillMaxSize()
                        .background(color = ComposeAppTheme.colors.dark)
                )
                GoToSettingsBox(onCameraPermissionSettingsClick)
            }

            Box(Modifier.align(Alignment.TopCenter).fillMaxWidth()) {
                AppBar(
                    navigationIcon = {
                        HsIconButton(onClick = onCloseClick) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_arrow_left_24),
                                contentDescription = stringResource(R.string.Button_Back),
                                tint = ComposeAppTheme.colors.white
                            )
                        }
                    },
                    backgroundColor = Color.Transparent
                )
            }

            Column(
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .align(Alignment.BottomCenter),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(Modifier.height(24.dp))
                if (showPasteButton) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        HSButton(
                            modifier = Modifier.weight(1f),
                            variant = ButtonVariant.Secondary,
                            title = stringResource(R.string.ScanQr_Photos),
                            icon = painterResource(R.drawable.ic_gallery_24),
                            onClick = {
                                galleryLauncher.launch(
                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                )
                            }
                        )
                        HSButton(
                            modifier = Modifier.weight(1f),
                            title = stringResource(R.string.Send_Button_Paste),
                            icon = painterResource(R.drawable.ic_copy_24),
                            onClick = { onScan(TextHelper.getCopiedText() ?: "") }
                        )
                    }
                } else {
                    HSButton(
                        modifier = Modifier.fillMaxWidth(),
                        variant = ButtonVariant.Secondary,
                        title = stringResource(R.string.ScanQr_Photos),
                        icon = painterResource(R.drawable.ic_gallery_24),
                        onClick = {
                            galleryLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        }
                    )
                }
                Spacer(Modifier.height(48.dp))
            }
        }
    }
}

@Composable
private fun ScannerView(
    onScan: (String) -> Unit,
    allowDataMatrix: Boolean
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val latestOnScan by rememberUpdatedState(onScan)
    val scanDelivered = remember { AtomicBoolean(false) }
    val analyzerExecutor = remember { Executors.newSingleThreadExecutor() }
    val previewView = remember {
        PreviewView(context).apply {
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
    }

    AndroidView(factory = { previewView })

    DisposableEffect(context, lifecycleOwner, previewView, allowDataMatrix) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        val listener = Runnable {
            val cameraProvider = try {
                cameraProviderFuture.get()
            } catch (error: Exception) {
                return@Runnable
            }

            val resolutionSelector = ResolutionSelector.Builder()
                .setResolutionStrategy(ResolutionStrategy.HIGHEST_AVAILABLE_STRATEGY)
                .setAspectRatioStrategy(AspectRatioStrategy.RATIO_16_9_FALLBACK_AUTO_STRATEGY)
                .setAllowedResolutionMode(
                    ResolutionSelector.PREFER_HIGHER_RESOLUTION_OVER_CAPTURE_RATE
                )
                .build()
            val preview = CameraPreview.Builder()
                .setResolutionSelector(resolutionSelector)
                .build()
            val imageAnalysis = ImageAnalysis.Builder()
                .setResolutionSelector(resolutionSelector)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            imageAnalysis.setAnalyzer(analyzerExecutor) { image ->
                val decoded = decodeImageProxyWithBinaryEyeEngine(
                    image,
                    scanDelivered,
                    allowDataMatrix
                )
                if (decoded != null) {
                    previewView.post {
                        latestOnScan(decoded)
                    }
                }
            }

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    imageAnalysis
                )
                preview.surfaceProvider = previewView.surfaceProvider
            } catch (error: Exception) {
                cameraProvider.unbindAll()
            }
        }

        cameraProviderFuture.addListener(listener, ContextCompat.getMainExecutor(context))

        onDispose {
            try {
                cameraProviderFuture.get().unbindAll()
            } catch (_: Exception) {
            }
            analyzerExecutor.shutdown()
        }
    }
}

@Composable
private fun GoToSettingsBox(onCameraPermissionSettingsClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        subhead2_grey(
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 40.dp),
            text = stringResource(R.string.ScanQr_CameraPermissionDeniedText)
        )
        Spacer(Modifier.height(24.dp))
        TextPrimaryButton(
            onClick = onCameraPermissionSettingsClick,
            title = stringResource(R.string.ScanQr_GoToSettings)
        )
    }
}

@Composable
private fun TextPrimaryButton(
    title: String,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }

    Surface(
        color = ComposeAppTheme.colors.transparent,
        contentColor = Bright,
    ) {
        Row(
            Modifier
                .defaultMinSize(
                    minWidth = ButtonPrimaryDefaults.MinWidth,
                    minHeight = ButtonPrimaryDefaults.MinHeight
                )
                .padding(ButtonPrimaryDefaults.ContentPadding)
                .clickable(
                    onClick = onClick,
                    interactionSource = interactionSource,
                    indication = null
                ),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
            content = {
                Text(
                    text = title,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    style = ComposeAppTheme.typography.headline2
                )
            }
        )
    }
}

@Composable
private fun PermissionNeededDialog(
    onOkClick: () -> Unit,
    onCancelClick: () -> Unit,
) {
    ComposeAppTheme {
        Dialog(onDismissRequest = onCancelClick) {
            Column(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(color = ComposeAppTheme.colors.lawrence)
                    .padding(horizontal = 24.dp, vertical = 20.dp)
            ) {
                title3_leah(text = stringResource(R.string.ScanQr_CameraPermission_Title))
                Spacer(Modifier.height(12.dp))
                body_leah(text = stringResource(R.string.ScanQr_PleaseGrantCameraPermission))
                Spacer(Modifier.height(32.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    ButtonPrimaryTransparent(
                        onClick = onCancelClick,
                        title = stringResource(R.string.Button_Cancel)
                    )
                    Spacer(Modifier.width(8.dp))
                    ButtonPrimaryYellow(
                        onClick = onOkClick,
                        title = stringResource(R.string.Button_Ok)
                    )
                }
            }
        }
    }
}

@Preview
@Composable
private fun Preview_PermissionNeededDialog() {
    ComposeAppTheme {
        PermissionNeededDialog({}, {})
    }
}
