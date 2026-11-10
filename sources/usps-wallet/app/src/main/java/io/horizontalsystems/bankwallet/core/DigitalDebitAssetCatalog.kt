package io.horizontalsystems.bankwallet.core

import androidx.annotation.DrawableRes
import io.horizontalsystems.bankwallet.core.managers.MarketKitWrapper
import io.horizontalsystems.marketkit.models.BlockchainType
import io.horizontalsystems.marketkit.models.Coin
import io.horizontalsystems.marketkit.models.FullCoin
import io.horizontalsystems.marketkit.models.Token
import io.horizontalsystems.marketkit.models.TokenQuery
import io.horizontalsystems.marketkit.models.TokenType

object DigitalDebitAssetCatalog {

    private val usdcQuery = TokenQuery(
        BlockchainType.Ethereum,
        TokenType.Eip20("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
    )

    private data class AssetDefinition(
        val blockchainType: BlockchainType,
        val tokenType: TokenType,
        val displayCode: String,
        val displayName: String,
        val decimals: Int,
        @DrawableRes val imageRes: Int? = null
    ) {
        val tokenQuery = TokenQuery(blockchainType, tokenType)
    }

    private val definitions = listOf(
        AssetDefinition(
            blockchainType = usdcQuery.blockchainType,
            tokenType = usdcQuery.tokenType,
            displayCode = "USDC",
            displayName = "USD Coin",
            decimals = 6
        ),
        AssetDefinition(
            blockchainType = BlockchainType.Ethereum,
            tokenType = TokenType.Native,
            displayCode = "ETH",
            displayName = "Ethereum",
            decimals = 18
        )
    )

    private val definitionsByQueryId = definitions.associateBy { it.tokenQuery.id }
    private val definitionIndexByQueryId = definitions.mapIndexed { index, definition ->
        definition.tokenQuery.id to index
    }.toMap()

    val defaultActivationQueries: List<TokenQuery> = listOf(
        usdcQuery,
        TokenQuery(BlockchainType.Ethereum, TokenType.Native)
    )
    private val coreQueryIds = defaultActivationQueries.map { it.id }.toSet()

    fun isSupported(queryId: String?): Boolean {
        return queryId != null && definitionsByQueryId.containsKey(queryId)
    }

    fun isSupported(query: TokenQuery?): Boolean {
        return isSupported(query?.id)
    }

    fun isSupported(token: Token): Boolean {
        return isSupported(token.tokenQuery)
    }

    fun isSupported(fullCoin: FullCoin): Boolean {
        return fullCoin.tokens.any(::isSupported)
    }

    fun isCore(queryId: String?): Boolean {
        return queryId != null && queryId in coreQueryIds
    }

    fun isCore(token: Token): Boolean {
        return isCore(token.tokenQuery.id)
    }

    fun isJovonUsd(token: Token?): Boolean {
        return token?.tokenQuery?.id == usdcQuery.id
    }

    fun isIncludedInTopBalance(token: Token?): Boolean {
        return token?.tokenQuery?.id == usdcQuery.id
    }

    fun sortRank(token: Token?): Int {
        return token?.let { definitionIndexByQueryId[it.tokenQuery.id] } ?: Int.MAX_VALUE
    }

    fun displayCode(token: Token): String {
        return definitionsByQueryId[token.tokenQuery.id]?.displayCode ?: token.coin.code
    }

    fun displayName(token: Token): String {
        return definitionsByQueryId[token.tokenQuery.id]?.displayName ?: token.coin.name
    }

    fun displayBadge(token: Token): String? {
        return if (isSupported(token)) null else token.badge
    }

    @DrawableRes
    fun localImageRes(token: Token?): Int? {
        return token?.let { definitionsByQueryId[it.tokenQuery.id]?.imageRes }
    }

    fun supportedTokens(
        marketKit: MarketKitWrapper,
        accountType: io.horizontalsystems.bankwallet.entities.AccountType? = null
    ): List<Token> {
        return definitions.mapNotNull { definition ->
            val token = marketKit.token(definition.tokenQuery) ?: buildCustomToken(definition, marketKit)
            if (token == null) {
                null
            } else if (accountType == null || token.supports(accountType)) {
                token
            } else {
                null
            }
        }
    }

    fun defaultActivationTokens(
        marketKit: MarketKitWrapper,
        accountType: io.horizontalsystems.bankwallet.entities.AccountType? = null
    ): List<Token> {
        val defaultIds = defaultActivationQueries.map { it.id }.toSet()
        return supportedTokens(marketKit, accountType).filter { it.tokenQuery.id in defaultIds }
    }

    private fun buildCustomToken(definition: AssetDefinition, marketKit: MarketKitWrapper): Token? {
        if (definition.tokenType !is TokenType.Eip20) return null

        val blockchain = marketKit.blockchain(definition.blockchainType.uid) ?: return null

        return Token(
            coin = Coin(
                uid = definition.tokenQuery.customCoinUid,
                name = definition.displayName,
                code = definition.displayCode
            ),
            blockchain = blockchain,
            type = definition.tokenType,
            decimals = definition.decimals
        )
    }
}
