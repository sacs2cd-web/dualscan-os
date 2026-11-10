package io.horizontalsystems.bankwallet.modules.pin.core

import android.content.Context
import androidx.core.content.edit
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AppLockManager(
    context: Context,
    private val pinManager: PinManager
) {
    companion object {
        private const val PREFS_NAME = "app_lock_prefs"
        private const val KEY_LAST_BACKGROUND_TIME = "last_background_time"
    }

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val _isLockedFlow = MutableStateFlow(pinManager.isPinSet)
    val isLockedFlow: StateFlow<Boolean> = _isLockedFlow.asStateFlow()

    val isLocked: Boolean
        get() = _isLockedFlow.value && pinManager.isPinSet

    var keepUnlocked: Boolean
        get() = false
        private set(value) {
        }

    fun onAppBackground() {
        prefs.edit { putLong(KEY_LAST_BACKGROUND_TIME, System.currentTimeMillis()) }
    }

    fun onAppForeground() {
        lock()
    }

    fun lock() {
        if (!pinManager.isPinSet) {
            return
        }
        _isLockedFlow.value = true
        prefs.edit { remove(KEY_LAST_BACKGROUND_TIME) }
    }

    fun unlock() {
        _isLockedFlow.value = false
    }

    fun setKeepUnlocked() {
        // Biometric access is mandatory in this build, so foreground relock cannot be bypassed.
    }

    fun updateLastExitDate() {
        val currentTime = System.currentTimeMillis()
        prefs.edit { putLong(KEY_LAST_BACKGROUND_TIME, currentTime) }
    }
}
