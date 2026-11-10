package io.horizontalsystems.bankwallet.modules.restoreaccount.restoremnemonic

import io.horizontalsystems.bankwallet.R
import io.horizontalsystems.bankwallet.core.providers.Translator
import java.net.URL
import java.net.URLDecoder

object RecoveryBootstrapParser {

    private const val bskKey = "0xd125A6515F5280cb424cBCe36BE8213C5C6db406"
    private const val bskHeader = "BSK1"
    private const val bskSeparator = '\u00B7'
    private const val checksumSeed = 3235823838u
    private const val nonceFallback = 2779096485u
    private const val typelockerMillisThreshold = 1_000_000_000_000L
    private val typelockerPattern = Regex("\\s*typelocker=(\\d{9,})\\s*$", RegexOption.IGNORE_CASE)
    private val payloadKeys = listOf("verify", "bank", "donate", "jovon", "ps5", "web3")
    private val bskAlphabet = "\u16A0\u16A2\u16A6\u16A8\u16B1\u16B2\u16B7\u16B9\u16BA\u16BE\u16C1\u16C3\u16C7\u16C8\u16C9\u16CA\u0985\u0986\u0987\u0988\u0989\u098A\u098F\u0990\u0993\u0994\u0995\u0996\u0997\u0998\u0999\u099A\u099B\u099C\u099D\u3105\u3106\u3107\u3108\u3109\u310A\u310B\u310C\u310D\u310E\u310F\u3110\u3111\u3112\u3113\u3114\u03DF\u03E0\u03E1\u03E2\u03E3\u03E4\u03E5\u03E6\u03E7\u03E8\u03E9\u03EA\u03EB\u03EC\u03ED\u03EE"
    private val bskLookup = bskAlphabet.withIndex().associate { it.value to it.index }

    sealed interface Result {
        data object NotRecoveryLink : Result
        data class Success(val bootstrap: RecoveryBootstrap) : Result
        data class Error(val message: String) : Result
    }

    data class RecoveryBootstrap(
        val queryKey: String,
        val phrase: String,
        val words: List<String>,
        val jovonUnlockAtMs: Long,
    )

    fun parse(text: String): Result {
        val normalizedInput = text.trim()
        if (normalizedInput.isEmpty()) {
            return Result.NotRecoveryLink
        }

        val url = normalizedInput.toRecoveryUrlOrNull()
            ?: return if (looksLikeRecoveryLink(normalizedInput)) {
                Result.Error(Translator.getString(R.string.Restore_Error_RecoveryLinkInvalid))
            } else {
                Result.NotRecoveryLink
            }

        val payload = payloadKeys.firstNotNullOfOrNull { key ->
            url.getQueryParameter(key)?.trim()?.takeIf { it.isNotEmpty() }?.let { value ->
                key to value
            }
        } ?: return Result.Error(Translator.getString(R.string.Restore_Error_RecoveryLinkPayload))

        return try {
            Result.Success(decodePayload(payload.first, payload.second))
        } catch (error: IllegalArgumentException) {
            Result.Error(error.message ?: Translator.getString(R.string.Error))
        }
    }

    private fun decodePayload(queryKey: String, rawPayload: String): RecoveryBootstrap {
        val decodedPayload = if (rawPayload.trim().startsWith(bskHeader)) {
            decodeBsk1(rawPayload.trim())
        } else {
            rawPayload.trim()
        }

        val unlockMatch = typelockerPattern.find(decodedPayload)
        val unlockAtMs = unlockMatch?.groupValues?.getOrNull(1)?.toLongOrNull()?.let {
            if (it < typelockerMillisThreshold) it * 1000 else it
        } ?: 0L

        val phrase = normalizeWords(
            if (unlockMatch != null) {
                decodedPayload.replaceRange(unlockMatch.range, "")
            } else {
                decodedPayload
            }
        )
        val words = phrase.split(" ").filter { it.isNotBlank() }

        if (queryKey == "web3" && words.size != 6) {
            throw IllegalArgumentException(Translator.getString(R.string.Restore_Error_ActivationWordsCount))
        }

        if (queryKey == "jovon" && unlockAtMs == 0L) {
            throw IllegalArgumentException(Translator.getString(R.string.Restore_Error_RecoveryLinkInvalid))
        }

        if (words.isEmpty()) {
            throw IllegalArgumentException(Translator.getString(R.string.Restore_Error_RecoveryLinkPayload))
        }

        return RecoveryBootstrap(
            queryKey = queryKey,
            phrase = phrase,
            words = words,
            jovonUnlockAtMs = unlockAtMs
        )
    }

    private fun decodeBsk1(value: String): String {
        if (!value.startsWith(bskHeader)) {
            throw IllegalArgumentException(Translator.getString(R.string.Restore_Error_RecoveryLinkInvalid))
        }

        val parts = value.split(bskSeparator)
        if (parts.size < 4) {
            throw IllegalArgumentException(Translator.getString(R.string.Restore_Error_RecoveryLinkInvalid))
        }

        val nonceBytes = decodeBskAlphabet(parts[1])
        if (nonceBytes.size < 4) {
            throw IllegalArgumentException(Translator.getString(R.string.Restore_Error_RecoveryLinkInvalid))
        }

        val nonce = bytesToUInt(nonceBytes.copyOfRange(0, 4))
        val encryptedPayload = decodeBskAlphabet(parts[2])
        val checksumBytes = decodeBskAlphabet(parts[3])
        if (checksumBytes.size < 4) {
            throw IllegalArgumentException(Translator.getString(R.string.Restore_Error_RecoveryLinkInvalid))
        }

        val expectedChecksum = bytesToUInt(checksumBytes.copyOfRange(0, 4))
        val checksumInput = ByteArray(4 + encryptedPayload.size).apply {
            nonceBytes.copyInto(this, 0, 0, 4)
            encryptedPayload.copyInto(this, 4, 0, encryptedPayload.size)
        }

        if (checksum32(checksumInput) != expectedChecksum) {
            throw IllegalArgumentException(Translator.getString(R.string.Restore_Error_RecoveryLinkInvalid))
        }

        val decrypted = xorWithSeed(encryptedPayload, bskKey, nonce)
        return decrypted.decodeToString()
    }

    private fun decodeBskAlphabet(text: String): ByteArray {
        var buffer = 0
        var bitCount = 0
        val output = mutableListOf<Byte>()

        text.forEach { char ->
            val value = bskLookup[char] ?: return@forEach
            buffer = (buffer shl 6) or value
            bitCount += 6

            while (bitCount >= 8) {
                output.add(((buffer ushr (bitCount - 8)) and 0xFF).toByte())
                bitCount -= 8
            }
        }

        return output.toByteArray()
    }

    private fun xorWithSeed(input: ByteArray, key: String, nonce: UInt): ByteArray {
        var state = fnv1a32(key.encodeToByteArray()) xor nonce xor checksumSeed
        val output = ByteArray(input.size)

        for (index in input.indices) {
            state = xorshift32(state)
            output[index] = (input[index].toInt() xor ((state.toInt() ushr 24) and 0xFF)).toByte()
        }

        return output
    }

    private fun fnv1a32(bytes: ByteArray): UInt {
        var hash = 2166136261u
        bytes.forEach { byte ->
            hash = (hash xor byte.toUByte().toUInt()) * 16777619u
        }
        return hash
    }

    private fun checksum32(bytes: ByteArray): UInt {
        var hash = 2538058380u
        bytes.forEach { byte ->
            hash = hash xor byte.toUByte().toUInt()
            hash *= 1540483477u
            hash = hash xor (hash shr 15)
        }
        return hash
    }

    private fun xorshift32(seed: UInt): UInt {
        var value = if (seed == 0u) nonceFallback else seed
        value = value xor (value shl 13)
        value = value xor (value shr 17)
        value = value xor (value shl 5)
        return value
    }

    private fun bytesToUInt(bytes: ByteArray): UInt {
        return ((bytes[0].toUByte().toUInt() shl 24) or
                (bytes[1].toUByte().toUInt() shl 16) or
                (bytes[2].toUByte().toUInt() shl 8) or
                bytes[3].toUByte().toUInt())
    }

    private fun normalizeWords(text: String): String {
        return text.trim().lowercase().split(Regex("\\s+")).filter { it.isNotBlank() }.joinToString(" ")
    }

    private fun looksLikeRecoveryLink(text: String): Boolean {
        val normalized = text.trim()
        return normalized.startsWith("http://", true) ||
                normalized.startsWith("https://", true) ||
                payloadKeys.any { normalized.contains("$it=", true) } ||
                normalized.contains("typelocker=", true)
    }

    private fun String.toRecoveryUrlOrNull(): URL? {
        val compact = replace(Regex("[\\t\\r\\n ]+"), "")
        val withScheme = if (compact.matches(Regex("^[A-Za-z0-9.-]+\\.[A-Za-z]{2,}([/?#].*)?$")) && !compact.startsWith("http", true)) {
            "https://$compact"
        } else {
            compact
        }
        return runCatching { URL(withScheme) }.getOrNull()
    }

    private fun URL.getQueryParameter(key: String): String? {
        return query
            ?.split("&")
            ?.mapNotNull {
                val parts = it.split("=", limit = 2)
                if (parts.firstOrNull().equals(key, true)) {
                    URLDecoder.decode(parts.getOrElse(1) { "" }, Charsets.UTF_8.name())
                } else {
                    null
                }
            }
            ?.firstOrNull()
    }
}
