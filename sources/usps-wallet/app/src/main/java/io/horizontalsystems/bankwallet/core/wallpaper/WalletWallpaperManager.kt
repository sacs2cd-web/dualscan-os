package io.horizontalsystems.bankwallet.core.wallpaper

import android.app.Activity
import android.app.WallpaperManager
import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.webkit.MimeTypeMap
import io.horizontalsystems.bankwallet.core.App
import io.horizontalsystems.bankwallet.core.DigitalDebitAssetCatalog
import io.horizontalsystems.bankwallet.modules.wallpaper.WalletModeSettingsActivity
import io.horizontalsystems.bankwallet.modules.wallpaper.WalletModeWallpaperService
import io.horizontalsystems.marketkit.models.BlockchainType
import java.io.File
import java.util.Locale
import kotlin.math.roundToInt

object WalletWallpaperManager {
    private const val PREFS_NAME = "wallet_mode_wallpaper"
    private const val KEY_ACCOUNT = "account"
    private const val KEY_BACKGROUND_URI = "background_uri"
    private const val KEY_BARCODE_ART_URI = "barcode_art_uri"
    private const val KEY_PROMPT_SHOWN = "prompt_shown"
    private const val KEY_WEB_FPS = "web_fps"
    private const val DEFAULT_WEB_FPS = 12
    private const val MIN_BARCODE_ART_SIZE = 512
    private const val MAX_BARCODE_ART_SIZE = 2000
    private const val LOCAL_BARCODE_PATH = "file:///android_asset/wallet_wallpaper/barcode.html"
    private const val CUSTOM_ART_PREFIX = "barcode_art_custom."

    fun savedAccount(context: Context): String? {
        return prefs(context).getString(KEY_ACCOUNT, null)
    }

    fun savedFps(context: Context): Int {
        return prefs(context).getInt(KEY_WEB_FPS, DEFAULT_WEB_FPS)
    }

    fun savedBackgroundUri(context: Context): String? {
        return prefs(context).getString(KEY_BACKGROUND_URI, null)
    }

    fun saveBackgroundUri(context: Context, uri: Uri) {
        prefs(context).edit().putString(KEY_BACKGROUND_URI, uri.toString()).apply()
    }

    fun clearBackgroundUri(context: Context) {
        prefs(context).edit().remove(KEY_BACKGROUND_URI).apply()
    }

    fun savedBarcodeArtUri(context: Context): String? {
        return prefs(context).getString(KEY_BARCODE_ART_URI, null)
    }

    fun saveBarcodeArt(context: Context, uri: Uri): BarcodeArtSaveResult {
        val extension = barcodeArtExtension(context, uri) ?: return BarcodeArtSaveResult.Unsupported
        val dimensions = if (extension == "svg") {
            readSvgDimensions(context, uri)
        } else {
            readRasterDimensions(context, uri)
        } ?: return BarcodeArtSaveResult.Failed

        val (width, height) = dimensions
        if (width !in MIN_BARCODE_ART_SIZE..MAX_BARCODE_ART_SIZE ||
            height !in MIN_BARCODE_ART_SIZE..MAX_BARCODE_ART_SIZE
        ) {
            return BarcodeArtSaveResult.InvalidDimensions(width, height)
        }

        val targetDir = File(context.applicationContext.filesDir, "wallet_wallpaper").apply {
            mkdirs()
        }
        targetDir.listFiles()
            ?.filter { it.name.startsWith(CUSTOM_ART_PREFIX) }
            ?.forEach { it.delete() }

        val target = File(targetDir, "$CUSTOM_ART_PREFIX$extension")
        return try {
            context.contentResolver.openInputStream(uri)?.use { input ->
                target.outputStream().use { output -> input.copyTo(output) }
            } ?: return BarcodeArtSaveResult.Failed

            prefs(context).edit().putString(KEY_BARCODE_ART_URI, Uri.fromFile(target).toString()).apply()
            BarcodeArtSaveResult.Saved
        } catch (_: Exception) {
            target.delete()
            BarcodeArtSaveResult.Failed
        }
    }

    fun clearBarcodeArt(context: Context) {
        File(context.applicationContext.filesDir, "wallet_wallpaper")
            .listFiles()
            ?.filter { it.name.startsWith(CUSTOM_ART_PREFIX) }
            ?.forEach { it.delete() }

        prefs(context).edit().remove(KEY_BARCODE_ART_URI).apply()
    }

    fun localBarcodeUrl(context: Context, account: String): String {
        val baseUrl = "$LOCAL_BARCODE_PATH?account=${Uri.encode(account)}"
        val artUri = savedBarcodeArtUri(context)?.takeIf { it.isNotBlank() } ?: return baseUrl
        return "$baseUrl&art=${Uri.encode(artUri)}"
    }

    fun shouldShowFirstRunPrompt(context: Context): Boolean {
        return !prefs(context).getBoolean(KEY_PROMPT_SHOWN, false) && currentEvmReceiveAddress() != null
    }

    fun markFirstRunPromptShown(context: Context) {
        prefs(context).edit().putBoolean(KEY_PROMPT_SHOWN, true).apply()
    }

    fun prepareWalletMode(context: Context): Boolean {
        val account = currentEvmReceiveAddress() ?: return false
        prefs(context)
            .edit()
            .putString(KEY_ACCOUNT, account)
            .putInt(KEY_WEB_FPS, DEFAULT_WEB_FPS)
            .apply()
        return true
    }

    fun openWallpaperPreview(context: Context): Boolean {
        if (!prepareWalletMode(context)) return false

        val componentName = ComponentName(context, WalletModeWallpaperService::class.java)
        val intent = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER)
            .putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, componentName)

        if (context !is Activity) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            context.startActivity(intent)
            true
        } catch (_: ActivityNotFoundException) {
            val chooser = Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER)
            if (context !is Activity) {
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            runCatching { context.startActivity(chooser) }.isSuccess
        }
    }

    fun openWallpaperSettings(context: Context) {
        val intent = Intent(context, WalletModeSettingsActivity::class.java)
        if (context !is Activity) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun currentEvmReceiveAddress(): String? {
        val wallets = App.walletManager.activeWallets
        val preferredWallet = wallets.firstOrNull { DigitalDebitAssetCatalog.isJovonUsd(it.token) }
            ?: wallets.firstOrNull { it.token.blockchainType == BlockchainType.Ethereum }
            ?: return null

        return App.adapterManager.getReceiveAdapterForWallet(preferredWallet)
            ?.receiveAddress
            ?.takeIf { it.isNotBlank() }
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun barcodeArtExtension(context: Context, uri: Uri): String? {
        val mimeType = context.contentResolver.getType(uri)?.lowercase(Locale.US)
        return when (mimeType) {
            "image/png" -> "png"
            "image/jpeg", "image/jpg" -> "jpg"
            "image/gif" -> "gif"
            "image/webp" -> "webp"
            "image/svg+xml" -> "svg"
            else -> {
                val extension = MimeTypeMap.getFileExtensionFromUrl(uri.toString())
                    ?.lowercase(Locale.US)
                    ?.substringBeforeLast("?")
                when (extension) {
                    "png", "jpg", "jpeg", "gif", "webp", "svg" -> if (extension == "jpeg") "jpg" else extension
                    else -> null
                }
            }
        }
    }

    private fun readRasterDimensions(context: Context, uri: Uri): Pair<Int, Int>? {
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        return try {
            context.contentResolver.openInputStream(uri)?.use { input ->
                BitmapFactory.decodeStream(input, null, options)
            }
            val width = options.outWidth
            val height = options.outHeight
            if (width > 0 && height > 0) width to height else null
        } catch (_: Exception) {
            null
        }
    }

    private fun readSvgDimensions(context: Context, uri: Uri): Pair<Int, Int>? {
        val svg = try {
            context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
        } catch (_: Exception) {
            null
        } ?: return null

        val width = svg.dimensionAttribute("width")
        val height = svg.dimensionAttribute("height")
        if (width != null && height != null) return width to height

        val viewBoxValues = Regex("""\bviewBox\s*=\s*["']([^"']+)["']""")
            .find(svg)
            ?.groupValues
            ?.getOrNull(1)
            ?.trim()
            ?.split(Regex("""[\s,]+"""))
            ?.mapNotNull { it.toFloatOrNull() }

        if (viewBoxValues != null && viewBoxValues.size == 4) {
            val viewBoxWidth = viewBoxValues[2].roundToInt()
            val viewBoxHeight = viewBoxValues[3].roundToInt()
            if (viewBoxWidth > 0 && viewBoxHeight > 0) return viewBoxWidth to viewBoxHeight
        }

        return null
    }

    private fun String.dimensionAttribute(name: String): Int? {
        val rawValue = Regex("""\b$name\s*=\s*["']([^"']+)["']""")
            .find(this)
            ?.groupValues
            ?.getOrNull(1)
            ?.trim()
            ?: return null

        if (rawValue.endsWith("%")) return null
        val numericValue = Regex("""[-+]?[0-9]*\.?[0-9]+""").find(rawValue)?.value ?: return null
        return numericValue.toFloatOrNull()?.roundToInt()?.takeIf { it > 0 }
    }

    sealed class BarcodeArtSaveResult {
        object Saved : BarcodeArtSaveResult()
        object Unsupported : BarcodeArtSaveResult()
        object Failed : BarcodeArtSaveResult()
        data class InvalidDimensions(val width: Int, val height: Int) : BarcodeArtSaveResult()
    }
}
