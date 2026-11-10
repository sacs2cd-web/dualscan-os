package io.horizontalsystems.bankwallet.core.addressformat

import io.horizontalsystems.marketkit.models.BlockchainType

sealed class ProprietaryAddressException : Throwable() {
    object InvalidAddress : ProprietaryAddressException()
    object NotUspsWalletAddress : ProprietaryAddressException()
}

data class NormalizedAddressInput(
    val canonical: String,
    val proprietaryDisplay: String,
    val detectedFormat: DetectedAddressFormat,
    val addressType: AddressType,
)

fun normalizeUserEnteredAddress(input: String, chainType: BlockchainType): NormalizedAddressInput {
    val trimmed = input.trim()
    if (trimmed.isEmpty()) throw ProprietaryAddressException.InvalidAddress

    if (validateCanonicalAddress(trimmed, chainType)) {
        return NormalizedAddressInput(
            canonical = trimmed,
            proprietaryDisplay = reverseAddressForDisplay(trimmed),
            detectedFormat = DetectedAddressFormat.canonical,
            addressType = AddressType.EXTERNAL_CANONICAL,
        )
    }

    val restored = restoreAddressForNetwork(trimmed)
    if (validateCanonicalAddress(restored, chainType)) {
        return NormalizedAddressInput(
            canonical = restored,
            proprietaryDisplay = reverseAddressForDisplay(restored),
            detectedFormat = DetectedAddressFormat.reversed,
            addressType = AddressType.USPS_PROPRIETARY,
        )
    }

    throw ProprietaryAddressException.InvalidAddress
}

fun normalizeUspsWalletAddress(input: String, chainType: BlockchainType): NormalizedAddressInput {
    // USPS Wallet uses the reversed string as a namespace boundary for closed-loop P2P.
    // Standard send flows must only accept proprietary USPS-form addresses and then
    // restore them back to canonical form before any blockchain-facing operation.
    val normalized = normalizeUserEnteredAddress(input, chainType)

    if (normalized.addressType != AddressType.USPS_PROPRIETARY) {
        throw ProprietaryAddressException.NotUspsWalletAddress
    }

    return normalized
}
