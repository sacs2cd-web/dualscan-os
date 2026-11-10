package io.horizontalsystems.bankwallet.core.addressformat

import io.horizontalsystems.marketkit.models.BlockchainType
import java.math.BigDecimal
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ProprietaryAddressFormatTest {

    @Test
    fun reverseAndRestore_evmAddress_preservesCharacters() {
        val canonical = "0xd125A6515F5280cb424cBCe36BE8213C5C6db406"
        val reversed = "604bd6C5C3128EB63eCBc424bc0825F5156A521dx0"

        assertEquals(reversed, reverseAddressForDisplay(canonical))
        assertEquals(canonical, restoreAddressForNetwork(reversed))
    }

    @Test
    fun normalizeUserEnteredAddress_acceptsCanonicalAndReversedForEvm() {
        val canonical = "0xd125A6515F5280cb424cBCe36BE8213C5C6db406"
        val reversed = reverseAddressForDisplay(canonical)

        val canonicalResult = normalizeUserEnteredAddress(canonical, BlockchainType.Ethereum)
        assertEquals(canonical, canonicalResult.canonical)
        assertEquals(reversed, canonicalResult.proprietaryDisplay)
        assertEquals(DetectedAddressFormat.canonical, canonicalResult.detectedFormat)
        assertEquals(AddressType.EXTERNAL_CANONICAL, canonicalResult.addressType)

        val reversedResult = normalizeUserEnteredAddress(reversed, BlockchainType.Ethereum)
        assertEquals(canonical, reversedResult.canonical)
        assertEquals(reversed, reversedResult.proprietaryDisplay)
        assertEquals(DetectedAddressFormat.reversed, reversedResult.detectedFormat)
        assertEquals(AddressType.USPS_PROPRIETARY, reversedResult.addressType)
    }

    @Test
    fun classifyAddress_blocksCanonicalAndAllowsReversedForEvm() {
        val canonical = "0xd125A6515F5280cb424cBCe36BE8213C5C6db406"
        val reversed = reverseAddressForDisplay(canonical)

        assertEquals(AddressType.EXTERNAL_CANONICAL, classifyAddress(canonical, BlockchainType.Polygon))
        assertEquals(AddressType.USPS_PROPRIETARY, classifyAddress(reversed, BlockchainType.Polygon))
        assertEquals(AddressType.INVALID, classifyAddress("not-an-address", BlockchainType.Polygon))
    }

    @Test
    fun bitcoinBase58_supportsCanonicalAndReversed() {
        val canonical = "1BoatSLRHtKNngkdXEeobR76b53LETtpyT"
        val reversed = reverseAddressForDisplay(canonical)

        assertTrue(validateCanonicalAddress(canonical, BlockchainType.Bitcoin))
        assertEquals(AddressType.EXTERNAL_CANONICAL, classifyAddress(canonical, BlockchainType.Bitcoin))
        assertEquals(AddressType.USPS_PROPRIETARY, classifyAddress(reversed, BlockchainType.Bitcoin))
        assertEquals(canonical, normalizeUserEnteredAddress(reversed, BlockchainType.Bitcoin).canonical)
    }

    @Test
    fun bitcoinBech32_supportsCanonicalAndReversed() {
        val canonical = "bc1qy3ekl877sll3pzw9ramknx0wgyxfhzlccv940y"
        val reversed = reverseAddressForDisplay(canonical)

        assertTrue(validateCanonicalAddress(canonical, BlockchainType.Bitcoin))
        assertEquals(AddressType.EXTERNAL_CANONICAL, classifyAddress(canonical, BlockchainType.Bitcoin))
        assertEquals(AddressType.USPS_PROPRIETARY, classifyAddress(reversed, BlockchainType.Bitcoin))
        assertEquals(canonical, normalizeUserEnteredAddress(reversed, BlockchainType.Bitcoin).canonical)
    }

    @Test
    fun normalizeUspsWalletAddress_rejectsCanonicalInput() {
        val canonical = "0xd125A6515F5280cb424cBCe36BE8213C5C6db406"

        try {
            normalizeUspsWalletAddress(canonical, BlockchainType.Ethereum)
            throw AssertionError("Expected canonical address to be blocked")
        } catch (error: ProprietaryAddressException.NotUspsWalletAddress) {
            assertTrue(true)
        }
    }

    @Test
    fun assertCanonicalBeforeNetwork_acceptsCanonicalOnly() {
        val canonical = "0xd125A6515F5280cb424cBCe36BE8213C5C6db406"
        val reversed = reverseAddressForDisplay(canonical)

        assertCanonicalBeforeNetwork(canonical, BlockchainType.Ethereum)

        try {
            assertCanonicalBeforeNetwork(reversed, BlockchainType.Ethereum)
            throw AssertionError("Expected reversed address to be rejected at the network guard")
        } catch (error: IllegalStateException) {
            assertTrue(error.message?.contains("Non-canonical") == true)
        }
    }

    @Test
    fun proprietaryDisplayAddress_onlyAppliesToSupportedChains() {
        val canonical = "0xd125A6515F5280cb424cBCe36BE8213C5C6db406"

        assertEquals(reverseAddressForDisplay(canonical), proprietaryDisplayAddress(canonical, BlockchainType.Ethereum))
        assertFalse(supportsProprietaryAddressFormat(BlockchainType.Solana))
        assertEquals(canonical, proprietaryDisplayAddress(canonical, BlockchainType.Solana))
    }

    @Test
    fun qrPayload_keepsAmountWhileExtractingReversedEvmAddress() {
        val canonical = "0xd125A6515F5280cb424cBCe36BE8213C5C6db406"
        val reversed = reverseAddressForDisplay(canonical)

        val payload = extractProprietaryQrPayload("ethereum:$reversed@137?amount=12.34")

        assertEquals(reversed, payload.addressInput)
        assertEquals(BigDecimal("12.34"), payload.amount)
        assertEquals(AddressType.USPS_PROPRIETARY, classifyAddress(payload.addressInput, BlockchainType.Polygon))
    }

    @Test
    fun qrPayload_keepsAmountWhileExtractingReversedBitcoinAddress() {
        val canonical = "1BoatSLRHtKNngkdXEeobR76b53LETtpyT"
        val reversed = reverseAddressForDisplay(canonical)

        val payload = extractProprietaryQrPayload("bitcoin:$reversed?amount=0.001")

        assertEquals(reversed, payload.addressInput)
        assertEquals(BigDecimal("0.001"), payload.amount)
        assertEquals(AddressType.USPS_PROPRIETARY, classifyAddress(payload.addressInput, BlockchainType.Bitcoin))
    }
}
