package io.horizontalsystems.bankwallet.core.addressformat

import io.horizontalsystems.marketkit.models.BlockchainType

const val PROPRIETARY_COPY_MODE = true

fun reverseAddressForDisplay(canonical: String): String = canonical.reversed()

fun restoreAddressForNetwork(reversed: String): String = reversed.reversed()

fun proprietaryDisplayAddress(address: String?, chainType: BlockchainType?): String? {
    val value = address?.trim()?.takeIf { it.isNotEmpty() } ?: return null
    return if (supportsProprietaryAddressFormat(chainType)) reverseAddressForDisplay(value) else value
}
