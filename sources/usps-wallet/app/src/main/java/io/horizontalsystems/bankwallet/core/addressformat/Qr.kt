package io.horizontalsystems.bankwallet.core.addressformat

import io.horizontalsystems.bankwallet.core.utils.AddressUriParser
import io.horizontalsystems.bankwallet.entities.AddressUri
import java.math.BigDecimal

data class ProprietaryQrPayload(
    val addressInput: String,
    val amount: BigDecimal?,
    val memo: String?,
    val addressUri: AddressUri?,
)

fun extractProprietaryQrPayload(rawText: String): ProprietaryQrPayload {
    val trimmed = rawText.trim()
    val addressUri = AddressUriParser.addressUri(trimmed)

    return if (addressUri != null) {
        ProprietaryQrPayload(
            addressInput = addressInputFromUri(addressUri),
            amount = addressUri.amount,
            memo = addressUri.memo,
            addressUri = addressUri,
        )
    } else {
        ProprietaryQrPayload(
            addressInput = trimmed,
            amount = null,
            memo = null,
            addressUri = null,
        )
    }
}

private fun addressInputFromUri(addressUri: AddressUri): String {
    // Amount-bearing QR codes wrap the USPS reversed address in a standard chain URI.
    // The proprietary boundary is still the address field itself, so scanners must
    // extract only that field before classifyAddress/normalizeUspsWalletAddress runs.
    return addressUri.address
        .trim()
        .removePrefix("${addressUri.scheme}:")
        .trimStart('/')
        .substringBefore("?")
        .substringBefore("@")
        .trim()
}
