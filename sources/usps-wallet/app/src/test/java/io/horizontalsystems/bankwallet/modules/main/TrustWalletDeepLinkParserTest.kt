package io.horizontalsystems.bankwallet.modules.main

import io.horizontalsystems.marketkit.models.BlockchainType
import io.horizontalsystems.marketkit.models.TokenType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.math.BigDecimal

class TrustWalletDeepLinkParserTest {

    @Test
    fun parsesHttpsSendLinkForEthereumUsdc() {
        val request = TrustWalletDeepLinkParser.parseSendRequest(
            "https://link.trustwallet.com/send?asset=c60_t0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48&address=604bd6C5C3128EB63eCBc424bc0825F5156A521dx0&amount=1.25&memo=test"
        )

        assertEquals(listOf(BlockchainType.Ethereum), request?.blockchainTypes)
        assertEquals(
            listOf(TokenType.Eip20("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")),
            request?.tokenTypes
        )
        assertEquals("604bd6C5C3128EB63eCBc424bc0825F5156A521dx0", request?.address)
        assertEquals(BigDecimal("1.25"), request?.amount)
        assertEquals("test", request?.memo)
    }

    @Test
    fun reversesCanonicalEvmAddressForUspsSendInput() {
        val canonical = "0xd125A6515F5280cb424cBCe36BE8213C5C6db406"
        val request = TrustWalletDeepLinkParser.parseSendRequest(
            "https://link.trustwallet.com/send?asset=c60_t0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48&address=$canonical"
        )

        assertEquals("604bd6C5C3128EB63eCBc424bc0825F5156A521dx0", request?.address)
    }

    @Test
    fun keepsAlreadyReversedEvmAddressForUspsSendInput() {
        val reversed = "604bd6C5C3128EB63eCBc424bc0825F5156A521dx0"
        val request = TrustWalletDeepLinkParser.parseSendRequest(
            "trust://send?asset=c60_t0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48&address=$reversed"
        )

        assertEquals(reversed, request?.address)
    }

    @Test
    fun parsesTrustSchemeSendLinkForPolygonUsdc() {
        val request = TrustWalletDeepLinkParser.parseSendRequest(
            "trust://send?asset=c966_t0x3c499c542cef5e3811e1192ce70d8cc03d5c3359&address=abc&amount=2"
        )

        assertEquals(listOf(BlockchainType.Polygon), request?.blockchainTypes)
        assertEquals(
            listOf(TokenType.Eip20("0x3c499c542cef5e3811e1192ce70d8cc03d5c3359")),
            request?.tokenTypes
        )
        assertEquals("abc", request?.address)
        assertEquals(BigDecimal("2"), request?.amount)
    }

    @Test
    fun ignoresNonTrustRoutes() {
        assertNull(
            TrustWalletDeepLinkParser.parseSendRequest(
                "https://example.com/send?asset=c60&address=abc"
            )
        )
    }
}
