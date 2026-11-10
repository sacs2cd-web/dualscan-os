package io.horizontalsystems.bankwallet.modules.wallpaper

import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.setPadding
import io.horizontalsystems.bankwallet.R
import io.horizontalsystems.bankwallet.core.BaseActivity
import io.horizontalsystems.bankwallet.core.wallpaper.WalletWallpaperManager

class WalletModeSettingsActivity : BaseActivity() {

    private lateinit var selectedBackgroundText: TextView
    private lateinit var selectedBarcodeArtText: TextView

    private val backgroundPicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri ?: return@registerForActivityResult

        contentResolver.takePersistableUriPermission(
            uri,
            Intent.FLAG_GRANT_READ_URI_PERMISSION
        )
        WalletWallpaperManager.saveBackgroundUri(this, uri)
        updateSelectedBackground()
        Toast.makeText(this, R.string.WalletMode_BackgroundSaved, Toast.LENGTH_SHORT).show()
    }

    private val barcodeArtPicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri ?: return@registerForActivityResult

        when (val result = WalletWallpaperManager.saveBarcodeArt(this, uri)) {
            is WalletWallpaperManager.BarcodeArtSaveResult.Saved -> {
                updateSelectedBarcodeArt()
                Toast.makeText(this, R.string.WalletMode_BarcodeArtSaved, Toast.LENGTH_SHORT).show()
            }
            is WalletWallpaperManager.BarcodeArtSaveResult.InvalidDimensions -> {
                Toast.makeText(
                    this,
                    getString(
                        R.string.WalletMode_BarcodeArtInvalidDimensions,
                        result.width,
                        result.height
                    ),
                    Toast.LENGTH_LONG
                ).show()
            }
            is WalletWallpaperManager.BarcodeArtSaveResult.Unsupported -> {
                Toast.makeText(this, R.string.WalletMode_BarcodeArtUnsupported, Toast.LENGTH_SHORT).show()
            }
            is WalletWallpaperManager.BarcodeArtSaveResult.Failed -> {
                Toast.makeText(this, R.string.WalletMode_BarcodeArtSaveFailed, Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.BLACK
        window.navigationBarColor = Color.BLACK

        val scrollView = ScrollView(this).apply {
            setBackgroundColor(Color.BLACK)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(Color.BLACK)
            setPadding(dp(18), dp(12), dp(18), dp(14))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        root.addView(titleText(getString(R.string.WalletMode_SettingsTitle)))

        root.addView(sectionTitleText(getString(R.string.WalletMode_BackgroundTitle)))
        root.addView(bodyText(getString(R.string.WalletMode_BackgroundDescription)))

        selectedBackgroundText = bodyText("")
        root.addView(selectedBackgroundText)

        root.addView(actionButton(getString(R.string.WalletMode_ChooseBackground)) {
            backgroundPicker.launch(arrayOf("image/png", "image/jpeg", "image/webp", "image/gif"))
        })

        root.addView(actionButton(getString(R.string.WalletMode_ClearBackground)) {
            WalletWallpaperManager.clearBackgroundUri(this)
            updateSelectedBackground()
            Toast.makeText(this, R.string.WalletMode_BackgroundCleared, Toast.LENGTH_SHORT).show()
        })

        root.addView(sectionTitleText(getString(R.string.WalletMode_BarcodeArtTitle)))
        root.addView(bodyText(getString(R.string.WalletMode_BarcodeArtDescription)))

        selectedBarcodeArtText = bodyText("")
        root.addView(selectedBarcodeArtText)

        root.addView(actionButton(getString(R.string.WalletMode_ChooseBarcodeArt)) {
            barcodeArtPicker.launch(arrayOf("image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"))
        })

        root.addView(actionButton(getString(R.string.WalletMode_ResetBarcodeArt)) {
            WalletWallpaperManager.clearBarcodeArt(this)
            updateSelectedBarcodeArt()
            Toast.makeText(this, R.string.WalletMode_BarcodeArtReset, Toast.LENGTH_SHORT).show()
        })

        root.addView(actionButton(getString(R.string.WalletMode_SetDeviceWallpaper)) {
            if (!WalletWallpaperManager.openWallpaperPreview(this)) {
                Toast.makeText(this, R.string.WalletMode_AddressUnavailable, Toast.LENGTH_SHORT).show()
            }
        })

        root.addView(secondaryButton(getString(R.string.Button_Close)) {
            finish()
        })

        scrollView.addView(root)
        setContentView(scrollView)
        updateSelectedBackground()
        updateSelectedBarcodeArt()
    }

    private fun updateSelectedBackground() {
        val hasBackground = WalletWallpaperManager.savedBackgroundUri(this) != null
        selectedBackgroundText.text = getString(
            if (hasBackground) R.string.WalletMode_BackgroundSelected else R.string.WalletMode_BackgroundEmpty
        )
    }

    private fun updateSelectedBarcodeArt() {
        val hasBarcodeArt = WalletWallpaperManager.savedBarcodeArtUri(this) != null
        selectedBarcodeArtText.text = getString(
            if (hasBarcodeArt) R.string.WalletMode_BarcodeArtSelected else R.string.WalletMode_BarcodeArtDefault
        )
    }

    private fun titleText(text: String) = TextView(this).apply {
        this.text = text
        setTextColor(Color.WHITE)
        textSize = 23f
        gravity = Gravity.CENTER
        setPadding(0, dp(18), 0, dp(8))
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
    }

    private fun sectionTitleText(text: String) = TextView(this).apply {
        this.text = text
        setTextColor(Color.WHITE)
        textSize = 17f
        gravity = Gravity.CENTER
        setPadding(0, dp(10), 0, dp(1))
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
    }

    private fun bodyText(text: String) = TextView(this).apply {
        this.text = text
        setTextColor(0xFFB7C4D6.toInt())
        textSize = 14f
        gravity = Gravity.CENTER
        setPadding(0, dp(2), 0, dp(5))
        setLineSpacing(0f, 0.95f)
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
    }

    private fun actionButton(text: String, onClick: () -> Unit) = Button(this).apply {
        this.text = text
        textSize = 14f
        minHeight = dp(42)
        minimumHeight = dp(42)
        includeFontPadding = false
        setTextColor(Color.WHITE)
        setBackgroundColor(0xFF0A4D8F.toInt())
        setPadding(dp(12), 0, dp(12), 0)
        setOnClickListener { onClick() }
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            dp(42)
        ).apply {
            topMargin = dp(7)
        }
    }

    private fun secondaryButton(text: String, onClick: () -> Unit) = Button(this).apply {
        this.text = text
        textSize = 14f
        minHeight = dp(40)
        minimumHeight = dp(40)
        includeFontPadding = false
        setTextColor(Color.WHITE)
        setBackgroundColor(0xFF1C2733.toInt())
        setPadding(dp(12), 0, dp(12), 0)
        setOnClickListener { onClick() }
        layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            dp(40)
        ).apply {
            topMargin = dp(8)
        }
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }
}
