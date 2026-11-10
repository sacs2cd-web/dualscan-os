package io.horizontalsystems.bankwallet.core.addressformat

import io.horizontalsystems.bitcoinkit.MainNet
import io.horizontalsystems.bitcoincore.utils.Base58AddressConverter
import io.horizontalsystems.bitcoincore.utils.SegwitAddressConverter
import io.horizontalsystems.marketkit.models.BlockchainType

private interface ProprietaryChainAdapter {
    fun supports(chainType: BlockchainType): Boolean
    fun validateCanonical(address: String): Boolean
}

private object EvmAddressAdapter : ProprietaryChainAdapter {
    private val evmRegex = Regex("^0x[a-fA-F0-9]{40}$")
    private val supportedTypes = setOf(
        BlockchainType.Ethereum,
        BlockchainType.BinanceSmartChain,
        BlockchainType.Polygon,
        BlockchainType.Avalanche,
        BlockchainType.Optimism,
        BlockchainType.Base,
        BlockchainType.ZkSync,
        BlockchainType.Gnosis,
        BlockchainType.Fantom,
        BlockchainType.ArbitrumOne,
    )

    override fun supports(chainType: BlockchainType): Boolean = chainType in supportedTypes

    override fun validateCanonical(address: String): Boolean = evmRegex.matches(address)
}

private object BitcoinAddressAdapter : ProprietaryChainAdapter {
    private val network = MainNet()
    private val base58Converter = Base58AddressConverter(network.addressVersion, network.addressScriptVersion)
    private val segwitConverter = SegwitAddressConverter(network.addressSegwitHrp)

    override fun supports(chainType: BlockchainType): Boolean = chainType == BlockchainType.Bitcoin

    override fun validateCanonical(address: String): Boolean {
        return try {
            base58Converter.convert(address)
            true
        } catch (_: Throwable) {
            try {
                segwitConverter.convert(address)
                true
            } catch (_: Throwable) {
                false
            }
        }
    }
}

private val proprietaryChainAdapters = listOf(
    EvmAddressAdapter,
    BitcoinAddressAdapter,
)

fun supportsProprietaryAddressFormat(chainType: BlockchainType?): Boolean {
    val type = chainType ?: return false
    return proprietaryChainAdapters.any { it.supports(type) }
}

fun validateCanonicalAddress(address: String, chainType: BlockchainType): Boolean {
    return proprietaryChainAdapters.firstOrNull { it.supports(chainType) }?.validateCanonical(address) == true
}

fun assertCanonicalBeforeNetwork(address: String, chainType: BlockchainType) {
    // Guardrail: reversed addresses are UI-only and must never leak into RPC, signing,
    // fee estimation, explorers, or third-party interoperability paths.
    check(validateCanonicalAddress(address, chainType)) {
        "Blocked: Non-canonical address leaked into network layer for $chainType"
    }
}
