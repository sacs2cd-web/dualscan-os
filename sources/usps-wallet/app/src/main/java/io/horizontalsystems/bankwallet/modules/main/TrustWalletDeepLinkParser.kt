package io.horizontalsystems.bankwallet.modules.main

import io.horizontalsystems.bankwallet.core.addressformat.AddressType
import io.horizontalsystems.bankwallet.core.addressformat.classifyAddress
import io.horizontalsystems.bankwallet.core.addressformat.reverseAddressForDisplay
import io.horizontalsystems.marketkit.models.BlockchainType
import io.horizontalsystems.marketkit.models.TokenType
import java.math.BigDecimal
import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

object TrustWalletDeepLinkParser {

    data class SendRequest(
        val blockchainTypes: List<BlockchainType>?,
        val tokenTypes: List<TokenType>?,
        val address: String,
        val amount: BigDecimal?,
        val memo: String?
    )

    fun parseSendRequest(deepLink: String): SendRequest? {
        val uri = runCatching { URI(deepLink) }.getOrNull() ?: return null
        if (!isTrustSendRoute(uri)) return null

        val parameters = queryParameters(uri.rawQuery)
        val address = parameters["address"]?.takeIf { it.isNotBlank() } ?: return null
        val asset = parameters["asset"]
        val amount = parameters["amount"]?.toBigDecimalOrNull()
        val memo = parameters["memo"] ?: parameters["data"]
        val assetFilter = asset?.let(::assetFilter)
        val uspsAddress = uspsDeeplinkAddress(address, assetFilter)

        return SendRequest(
            blockchainTypes = assetFilter?.blockchainTypes,
            tokenTypes = assetFilter?.tokenTypes,
            address = uspsAddress,
            amount = amount,
            memo = memo
        )
    }

    private fun isTrustSendRoute(uri: URI): Boolean {
        return when (uri.scheme?.lowercase()) {
            "trust" -> uri.host.equals("send", ignoreCase = true)
            "https" -> uri.host.equals("link.trustwallet.com", ignoreCase = true) &&
                    uri.path.equals("/send", ignoreCase = true)
            else -> false
        }
    }

    private data class AssetFilter(
        val blockchainTypes: List<BlockchainType>?,
        val tokenTypes: List<TokenType>?
    )

    private fun assetFilter(asset: String): AssetFilter? {
        val parts = asset.split("_t", limit = 2)
        val blockchainType = blockchainType(parts.firstOrNull() ?: return null) ?: return null
        val tokenType = parts.getOrNull(1)
            ?.takeIf { it.isNotBlank() }
            ?.let { TokenType.Eip20(it.lowercase()) }

        return AssetFilter(
            blockchainTypes = listOf(blockchainType),
            tokenTypes = tokenType?.let { listOf(it) }
        )
    }

    private fun blockchainType(trustCoinId: String): BlockchainType? {
        return when (trustCoinId.lowercase()) {
            // Trust Wallet UAI uses c<slip44> with an optional _t<contract> token suffix.
            "c60" -> BlockchainType.Ethereum
            "c966" -> BlockchainType.Polygon
            else -> null
        }
    }

    private fun uspsDeeplinkAddress(address: String, assetFilter: AssetFilter?): String {
        val candidateChains = assetFilter?.blockchainTypes ?: listOf(
            BlockchainType.Ethereum,
            BlockchainType.Polygon,
        )

        return when {
            candidateChains.any { classifyAddress(address, it) == AddressType.USPS_PROPRIETARY } -> {
                address
            }
            candidateChains.any { classifyAddress(address, it) == AddressType.EXTERNAL_CANONICAL } -> {
                // USPS Wallet send screens accept proprietary reversed addresses only.
                // Trust-style deeplinks may provide a normal 0x EVM address, so convert it
                // at the app boundary before pre-filling the scanner/deeplink send form.
                reverseAddressForDisplay(address)
            }
            else -> address
        }
    }

    private fun queryParameters(rawQuery: String?): Map<String, String> {
        if (rawQuery.isNullOrBlank()) return emptyMap()

        return rawQuery
            .split("&")
            .mapNotNull { pair ->
                val separator = pair.indexOf("=")
                if (separator <= 0) return@mapNotNull null

                val key = decode(pair.substring(0, separator))
                val value = decode(pair.substring(separator + 1))
                key to value
            }
            .toMap()
    }

    private fun decode(value: String): String {
        return URLDecoder.decode(value, StandardCharsets.UTF_8.name())
    }
}
