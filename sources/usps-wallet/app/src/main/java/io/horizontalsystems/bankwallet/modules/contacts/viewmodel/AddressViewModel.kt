package io.horizontalsystems.bankwallet.modules.contacts.viewmodel

import androidx.lifecycle.viewModelScope
import io.horizontalsystems.bankwallet.R
import io.horizontalsystems.bankwallet.core.ViewModelUiState
import io.horizontalsystems.bankwallet.core.addressformat.ProprietaryAddressException
import io.horizontalsystems.bankwallet.core.addressformat.normalizeUspsWalletAddress
import io.horizontalsystems.bankwallet.core.addressformat.proprietaryDisplayAddress
import io.horizontalsystems.bankwallet.core.managers.EvmBlockchainManager
import io.horizontalsystems.bankwallet.core.managers.MarketKitWrapper
import io.horizontalsystems.bankwallet.core.order
import io.horizontalsystems.bankwallet.core.providers.Translator
import io.horizontalsystems.bankwallet.entities.Address
import io.horizontalsystems.bankwallet.entities.DataState
import io.horizontalsystems.bankwallet.modules.address.AddressHandlerFactory
import io.horizontalsystems.bankwallet.modules.address.AddressParserChain
import io.horizontalsystems.bankwallet.modules.address.AddressValidationException
import io.horizontalsystems.bankwallet.modules.address.IAddressHandler
import io.horizontalsystems.bankwallet.modules.contacts.ContactsRepository
import io.horizontalsystems.bankwallet.modules.contacts.model.ContactAddress
import io.horizontalsystems.bankwallet.ui.compose.TranslatableString
import io.horizontalsystems.marketkit.models.Blockchain
import io.horizontalsystems.marketkit.models.BlockchainType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AddressViewModel(
    private val contactUid: String?,
    private val contactsRepository: ContactsRepository,
    private val addressHandlerFactory: AddressHandlerFactory,
    marketKit: MarketKitWrapper,
    contactAddress: ContactAddress?,
    definedAddresses: List<ContactAddress>?
) : ViewModelUiState<AddressViewModel.UiState>() {

    private val title = if (contactAddress == null)
        TranslatableString.ResString(R.string.Contacts_AddAddress)
    else
        TranslatableString.PlainString(contactAddress.blockchain.name)
    private var address = proprietaryDisplayAddress(contactAddress?.address, contactAddress?.blockchain?.type) ?: ""
    private val editingAddress = contactAddress
    private var addressState: DataState<Address>? =
        contactAddress?.address?.let { DataState.Success(Address(it)) }
    private val availableBlockchains: List<Blockchain>

    init {
        availableBlockchains = if (contactAddress == null) {
            val allBlockchainTypes = EvmBlockchainManager.blockchainTypes + listOf(
                BlockchainType.Bitcoin,
                BlockchainType.BitcoinCash,
                BlockchainType.Dash,
                BlockchainType.Litecoin,
                BlockchainType.Zcash,
                BlockchainType.Solana,
                BlockchainType.ECash,
                BlockchainType.Tron,
                BlockchainType.Ton,
                BlockchainType.Stellar,
            )
            val definedBlockchainTypes = definedAddresses?.map { it.blockchain.type } ?: listOf()
            val availableBlockchainUids =
                allBlockchainTypes.filter { !definedBlockchainTypes.contains(it) }.map { it.uid }

            marketKit.blockchains(availableBlockchainUids).sortedBy { it.type.order }
        } else {
            listOf()
        }
    }

    private var blockchain = contactAddress?.blockchain ?: availableBlockchains.first()
    private var addressParser: AddressParserChain =
        addressHandlerFactory.parserChain(blockchain.type, true)

    fun onEnterAddress(address: String) {
        this.address = address

        emitState()

        validateAddress(address)
    }

    fun onEnterBlockchain(blockchain: Blockchain) {
        this.blockchain = blockchain
        this.addressParser = addressHandlerFactory.parserChain(blockchain.type, true)

        emitState()

        validateAddress(address)
    }

    private var validationJob: Job? = null

    private fun validateAddress(address: String) {
        validationJob?.cancel()

        if (address.isEmpty()) {
            addressState = null
            emitState()
            return
        }

        validationJob = viewModelScope.launch {
            addressState = DataState.Loading
            emitState()

            addressState = try {
                val parsedAddress = parseAddress(address.trim())
                ensureActive()
                contactsRepository.validateAddress(
                    contactUid,
                    ContactAddress(blockchain, parsedAddress.hex)
                )
                DataState.Success(parsedAddress)
            } catch (error: Throwable) {
                ensureActive()
                DataState.Error(error)
            }
            emitState()
        }
    }

    override fun createState() = UiState(
        headerTitle = title,
        editingAddress = editingAddress,
        addressState = addressState,
        address = address,
        blockchain = blockchain,
        canChangeBlockchain = editingAddress == null,
        showDelete = editingAddress != null,
        availableBlockchains = availableBlockchains,
        doneEnabled = addressState is DataState.Success
    )

    private suspend fun parseAddress(value: String): Address =
        withContext(Dispatchers.IO) {
            try {
                val normalized = normalizeUspsWalletAddress(value, blockchain.type)
                address = normalized.proprietaryDisplay
                Address(normalized.canonical, blockchainType = blockchain.type)
            } catch (error: Throwable) {
                throw mapValidationError(error)
            }
        }

    private fun mapValidationError(error: Throwable): Throwable {
        return when (error) {
            ProprietaryAddressException.NotUspsWalletAddress ->
                Throwable(Translator.getString(R.string.Send_Address_Error_NotUspsWalletAddress))

            ProprietaryAddressException.InvalidAddress ->
                AddressValidationException.Invalid(
                    Throwable(Translator.getString(R.string.SwapSettings_Error_InvalidAddress)),
                    blockchain.name
                )

            is AddressValidationException -> error
            else -> AddressValidationException.Invalid(error, blockchain.name)
        }
    }

    data class UiState(
        val headerTitle: TranslatableString,
        val editingAddress: ContactAddress?,
        val addressState: DataState<Address>?,
        val address: String,
        val blockchain: Blockchain,
        val canChangeBlockchain: Boolean,
        val showDelete: Boolean,
        val availableBlockchains: List<Blockchain>,
        val doneEnabled: Boolean
    )
}
