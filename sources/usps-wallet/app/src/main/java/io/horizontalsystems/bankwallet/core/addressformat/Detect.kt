package io.horizontalsystems.bankwallet.core.addressformat

import io.horizontalsystems.marketkit.models.BlockchainType

enum class AddressType {
    USPS_PROPRIETARY,
    EXTERNAL_CANONICAL,
    INVALID
}

enum class DetectedAddressFormat {
    canonical,
    reversed
}

data class WalletAddressState(
    val canonical: String,
    val proprietaryDisplay: String,
    val chainType: BlockchainType,
    val source: Source,
    val detectedFormat: DetectedAddressFormat,
) {
    enum class Source {
        user_input,
        qr_scan,
        wallet_receive,
        address_book,
        rpc,
    }
}

fun isProbablyReversedAddress(input: String): Boolean {
    val trimmed = input.trim()
    if (trimmed.isEmpty()) return false

    return trimmed.endsWith("x0", ignoreCase = true) ||
        trimmed.endsWith(":muerehte", ignoreCase = true) ||
        trimmed.endsWith(":nioctib", ignoreCase = true)
}

fun classifyAddress(input: String, chainType: BlockchainType): AddressType {
    val trimmed = input.trim()
    if (trimmed.isEmpty()) return AddressType.INVALID

    if (validateCanonicalAddress(trimmed, chainType)) {
        return AddressType.EXTERNAL_CANONICAL
    }

    val restored = restoreAddressForNetwork(trimmed)
    return if (restored != trimmed && validateCanonicalAddress(restored, chainType)) {
        AddressType.USPS_PROPRIETARY
    } else {
        AddressType.INVALID
    }
}
