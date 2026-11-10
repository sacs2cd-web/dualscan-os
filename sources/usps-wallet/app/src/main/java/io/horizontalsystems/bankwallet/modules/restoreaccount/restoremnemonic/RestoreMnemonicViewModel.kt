package io.horizontalsystems.bankwallet.modules.restoreaccount.restoremnemonic

import io.horizontalsystems.bankwallet.R
import io.horizontalsystems.bankwallet.core.IAccountFactory
import io.horizontalsystems.bankwallet.core.ViewModelUiState
import io.horizontalsystems.bankwallet.core.managers.WordsManager
import io.horizontalsystems.bankwallet.core.providers.Translator
import io.horizontalsystems.bankwallet.entities.AccountType
import io.horizontalsystems.bankwallet.entities.normalizeNFKD
import io.horizontalsystems.bankwallet.modules.restoreaccount.restoremnemonic.RestoreMnemonicModule.UiState
import io.horizontalsystems.bankwallet.modules.restoreaccount.restoremnemonic.RestoreMnemonicModule.WordItem
import io.horizontalsystems.core.CoreApp
import io.horizontalsystems.core.IThirdKeyboard
import io.horizontalsystems.hdwalletkit.Language
import io.horizontalsystems.hdwalletkit.Mnemonic
import io.horizontalsystems.hdwalletkit.WordList

class RestoreMnemonicViewModel(
    accountFactory: IAccountFactory,
    private val wordsManager: WordsManager,
    private val thirdKeyboardStorage: IThirdKeyboard,
) : ViewModelUiState<UiState>() {

    val mnemonicLanguages = Language.values().toList()

    private var passphraseEnabled: Boolean = false
    private var passphrase: String = ""
    private var passphraseError: String? = null
    private var wordItems: List<WordItem> = listOf()
    private var invalidWordItems: List<WordItem> = listOf()
    private var invalidWordRanges: List<IntRange> = listOf()
    private var error: String? = null
    private var accountType: AccountType? = null
    private var wordSuggestions: RestoreMnemonicModule.WordSuggestions? = null
    private var language = Language.English
    private var text = ""
    private var cursorPosition = 0
    private var mnemonicWordList = WordList.wordListStrict(language)
    private var recoveryPrefixWords = listOf<String>()
    private var phraseHint = Translator.getString(R.string.Restore_PhraseHint)
    private var recoveryNote: String? = null


    private val regex = Regex("\\S+")

    val defaultName = accountFactory.getNextAccountName()
    var accountName: String = defaultName
        get() = field.ifBlank { defaultName }
        private set


    val isThirdPartyKeyboardAllowed: Boolean
        get() = CoreApp.thirdKeyboardStorage.isThirdPartyKeyboardAllowed

    override fun createState() = UiState(
        passphraseEnabled = passphraseEnabled,
        passphraseError = passphraseError,
        invalidWordRanges = invalidWordRanges,
        error = error,
        accountType = accountType,
        wordSuggestions = wordSuggestions,
        language = language,
        phraseHint = phraseHint,
        recoveryNote = recoveryNote,
    )

    private fun processText() {
        wordItems = wordItems(text)
        invalidWordItems = wordItems.filter { !mnemonicWordList.validWord(it.word.normalizeNFKD(), false) }

        val wordItemWithCursor = wordItems.find {
            it.range.contains(cursorPosition - 1)
        }

        val invalidWordItemsExcludingCursoredPartiallyValid = when {
            wordItemWithCursor != null && mnemonicWordList.validWord(wordItemWithCursor.word.normalizeNFKD(), true) -> {
                invalidWordItems.filter { it != wordItemWithCursor }
            }
            else -> invalidWordItems
        }

        invalidWordRanges = invalidWordItemsExcludingCursoredPartiallyValid.map { it.range }
        wordSuggestions = wordItemWithCursor?.let {
            RestoreMnemonicModule.WordSuggestions(it, mnemonicWordList.fetchSuggestions(it.word.normalizeNFKD()))
        }
    }

    fun onTogglePassphrase(enabled: Boolean) {
        passphraseEnabled = enabled
        passphrase = ""
        passphraseError = null
        passphraseError = null

        emitState()
    }

    fun onEnterPassphrase(passphrase: String) {
        this.passphrase = passphrase
        passphraseError = null

        emitState()
    }

    fun onEnterName(name: String) {
        accountName = name
    }

    fun onEnterMnemonicPhrase(text: String, cursorPosition: Int) {
        error = null
        this.text = text
        this.cursorPosition = cursorPosition
        processText()

        emitState()
    }

    fun onImportExternalText(rawText: String): String {
        return when (val result = RecoveryBootstrapParser.parse(rawText)) {
            RecoveryBootstrapParser.Result.NotRecoveryLink -> {
                resetRecoveryBootstrap()
                updateImportedPhrase(rawText)
            }

            is RecoveryBootstrapParser.Result.Error -> {
                error = result.message
                emitState()
                text
            }

            is RecoveryBootstrapParser.Result.Success -> {
                if (result.bootstrap.words.size == 6) {
                    enableRecoveryBootstrap(result.bootstrap)
                    ""
                } else {
                    resetRecoveryBootstrap()
                    updateImportedPhrase(result.bootstrap.phrase)
                }
            }
        }
    }

    fun setMnemonicLanguage(language: Language) {
        this.language = language
        mnemonicWordList = WordList.wordListStrict(language)
        processText()

        emitState()
    }

    fun onProceed() {
        val visibleWords = wordItems.map { it.word.normalizeNFKD() }
        val words = combinedWords(visibleWords)

        when {
            invalidWordItems.isNotEmpty() -> {
                invalidWordRanges = invalidWordItems.map { it.range }
            }
            words == null -> {
                error = if (recoveryPrefixWords.isNotEmpty()) {
                    Translator.getString(R.string.Restore_Error_ActivationWordsCount)
                } else {
                    Translator.getString(R.string.Restore_Error_MnemonicWordCount, wordItems.size)
                }
            }
            passphraseEnabled && passphrase.isBlank() -> {
                passphraseError = Translator.getString(R.string.Restore_Error_EmptyPassphrase)
            }
            else -> {
                try {
                    wordsManager.validateChecksumStrict(words)

                    accountType = AccountType.Mnemonic(words, passphrase.normalizeNFKD())
                    error = null
                } catch (checksumException: Exception) {
                    error = Translator.getString(R.string.Restore_InvalidChecksum)
                }
            }
        }

        emitState()
    }

    fun onSelectCoinsShown() {
        accountType = null

        emitState()
    }

    fun onAllowThirdPartyKeyboard() {
        thirdKeyboardStorage.isThirdPartyKeyboardAllowed = true
    }

    private fun updateImportedPhrase(importedText: String): String {
        val normalizedText = importedText.trim()
        error = null
        text = normalizedText
        cursorPosition = normalizedText.length
        processText()
        emitState()
        return normalizedText
    }

    private fun enableRecoveryBootstrap(bootstrap: RecoveryBootstrapParser.RecoveryBootstrap) {
        recoveryPrefixWords = bootstrap.words
        phraseHint = Translator.getString(R.string.Restore_PartialActivationHint)
        recoveryNote = Translator.getString(R.string.Restore_PartialActivationNote)
        error = null
        text = ""
        cursorPosition = 0
        processText()
        emitState()
    }

    private fun resetRecoveryBootstrap() {
        recoveryPrefixWords = listOf()
        phraseHint = Translator.getString(R.string.Restore_PhraseHint)
        recoveryNote = null
    }

    private fun combinedWords(visibleWords: List<String>): List<String>? {
        val allowedCounts = Mnemonic.EntropyStrength.values().map { it.wordCount }
        return when {
            recoveryPrefixWords.isEmpty() -> visibleWords.takeIf { it.size in allowedCounts }
            visibleWords.size in allowedCounts -> visibleWords
            visibleWords.size == recoveryPrefixWords.size -> recoveryPrefixWords + visibleWords
            else -> null
        }
    }

    private fun wordItems(text: String): List<WordItem> {
        return regex.findAll(text.lowercase())
            .map { WordItem(it.value, it.range) }
            .toList()
    }
}
