// =====================================
// PRAGMATIC AUTO-TRANSLATOR MAIN
// =====================================

import config from './config.js';
import { debugLog, truncateText } from './utils.js';
import { initializeCorpusLegacyFormat, getDocumentTitle } from './corpora-retrieval.js';
import { 
  loadEmbeddingModel, 
  createUserInputEmbedding, 
  isEmbeddingModelReady,
  getEmbeddingModelStatus,
  setJinaApiKey,
  storeApiKeyLocally, 
  getApiKeyStatus
} from './embedding-jina.js';

// =====================================
// GLOBAL VARIABLES (matching your existing structure)
// =====================================

let vectorData = {
    documents: [],
    paragraphs: [],
    sections: []
};

let documentDatabase = {
    english: {},
    spanish: {}
};

let currentSourceLang = 'en';

// =====================================
// DOM ELEMENTS (matching your existing structure)
// =====================================

const languageOptions = document.querySelectorAll('.language-option');
const targetLanguageSpan = document.getElementById('targetLanguage');
const sourceTextArea = document.getElementById('sourceText');
const translateButton = document.getElementById('translateButton');
const statusIndicator = document.getElementById('statusIndicator');
const translationOutput = document.getElementById('translationOutput');
const contextInfo = document.getElementById('contextInfo');

// =====================================
// STATUS INDICATOR SYSTEM (preserving your existing pattern)
// =====================================

/**
 * Show status message to user (matches your existing showStatus function)
 * @param {string} message - Status message
 * @param {string} type - Status type ('loading', 'success', 'error')
 */
function showStatus(message, type = 'info') {
    if (!statusIndicator) return;
    
    statusIndicator.textContent = message;
    // Use your existing CSS class structure
    statusIndicator.className = `status-indicator status-${type}`;
    statusIndicator.classList.remove('hidden');
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusIndicator.classList.add('hidden');
        }, 3000);
    }
    
    debugLog(`Status: ${message} (${type})`, type === 'error' ? 'error' : 'info');
}

// =====================================
// LANGUAGE TOGGLE (preserving your existing functionality)
// =====================================

/**
 * Setup language toggle functionality (matches your existing pattern)
 */
function setupLanguageToggle() {
    if (!languageOptions.length) {
        debugLog('Language toggle elements not found', 'warn');
        return;
    }
    
    languageOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            languageOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            option.classList.add('active');
            
            // Update current source language
            currentSourceLang = option.dataset.lang;
            
            // Update target language display
            if (targetLanguageSpan) {
                targetLanguageSpan.textContent = currentSourceLang === 'en' ? 'Spanish' : 'English';
            }
            
            // Update placeholder text
            if (sourceTextArea) {
                if (currentSourceLang === 'en') {
                    sourceTextArea.placeholder = 'Enter your English text here for translation to Spanish...';
                } else {
                    sourceTextArea.placeholder = 'Ingrese su texto en español aquí para traducir al inglés...';
                }
            }
            
            debugLog(`Language direction changed: ${currentSourceLang} → ${currentSourceLang === 'en' ? 'es' : 'en'}`, 'info');
        });
    });
    
    debugLog('Language toggle setup complete', 'info');
}

// =====================================
// CORPUS LOADING (using our modular approach)
// =====================================

/**
 * Load vector data and document databases (modular version of your existing function)
 */
async function loadCorpusData() {
    console.log('Loading corpus data using modular approach...');
    showStatus('Loading corpus vector data...', 'loading');
    
    try {
        // Use our modular loading function
        const corpusData = await initializeCorpusLegacyFormat();
        
        // Assign to global variables (matching your existing structure)
        vectorData = corpusData.vectorData;
        documentDatabase = corpusData.documentDatabase;
        
        const totalVectors = vectorData.documents.length + vectorData.paragraphs.length + vectorData.sections.length;
        
        // Success message (matching your existing pattern)
        const message = `Loaded ${vectorData.documents.length} documents, ${vectorData.sections.length} sections, ${vectorData.paragraphs.length} paragraphs (Total: ${totalVectors} vectors)`;
        console.log(message);
        showStatus(message, 'success');
        
        // Log sample for debugging (matching your existing pattern)
        console.log('Sample vector data:', {
            documents: vectorData.documents[0],
            sections: vectorData.sections[0],
            paragraphs: vectorData.paragraphs[0]
        });
        
        return true;
        
    } catch (error) {
        console.error('Error loading corpus data:', error);
        showStatus('Failed to load corpus data. Translation may not work optimally.', 'error');
        return false;
    }
}

// =====================================
// TRANSLATION SETUP (placeholder for now)
// =====================================

/**
 * Setup translate button (now with embedding functionality)
 */
function setupTranslateButton() {
    if (!translateButton) {
        debugLog('Translate button not found', 'warn');
        return;
    }
    
    translateButton.addEventListener('click', async () => {
        await handleTranslation();
    });
    
    debugLog('Translate button setup complete', 'info');
}

/**
 * Handle the complete translation process - UPDATED with similarity search
 */
async function handleTranslation() {
    const sourceText = sourceTextArea?.value.trim();
    
    if (!sourceText) {
        showStatus('Please enter some text to translate', 'error');
        return;
    }
    
    try {
        // Step 1: Ensure embedding API is ready
        const isReady = await isEmbeddingModelReady();
        if (!isReady) {
            showStatus('Checking embedding API...', 'loading');
            await loadEmbeddingModel();
            showStatus('Embedding API ready', 'success');
        }
        
        // Step 2: Create embedding for user input
        showStatus('Creating text embedding...', 'loading');
        const userEmbedding = await createUserInputEmbedding(sourceText);
        
        showStatus('Text vectorized successfully', 'success');
        debugLog(`Created embedding for user text (${userEmbedding.dimension} dimensions)`, 'info');
        
        // Step 3: Get UI options for similarity search
        const useAdvanced = document.getElementById('advancedScoring')?.checked !== false;
        const priorityStrategy = document.getElementById('priorityStrategy')?.value || 'balanced';
        
        // Step 4: Search for similar context
        showStatus('Searching corpus for relevant context...', 'loading');
        const contextResults = await findSimilarContext(userEmbedding.embedding, vectorData, {
            useAdvancedScoring: useAdvanced,
            priorityStrategy: priorityStrategy,
            maxContextLength: 8000  // Adjust based on your translation API limits
        });
        
        // Step 5: Show similarity search results
        const resultCount = contextResults.metadata.totalResults;
        const contextLength = contextResults.metadata.contextLength;
        
        if (resultCount > 0) {
            showStatus(`Found ${resultCount} relevant passages (${contextLength} chars)`, 'success');
        } else {
            showStatus('No relevant context found - translating without corpus assistance', 'error');
        }
        
        // Step 6: Check translation API readiness
        showStatus('Checking translation API...', 'loading');
        const translationReady = await isDeepSeekApiReady();
        
        if (!translationReady) {
            showStatus('DeepSeek API key required. Please set your API key.', 'error');
            
            // Show API key input prompt
            const apiKey = prompt('Please enter your DeepSeek API key:');
            if (apiKey) {
                setDeepSeekApiKey(apiKey);
                storeDeepSeekApiKeyLocally(apiKey);
                showStatus('API key set successfully', 'success');
            } else {
                showStatus('Translation cancelled - API key required', 'error');
                return;
            }
        }

                // Step 7: PERFORM TRANSLATION WITH CONTEXT
        showStatus('Translating with context...', 'loading');
        
        const languageDirection = getCurrentLanguageDirection();
        const translationResult = await translateWithContext(
            sourceText, 
            contextResults, 
            languageDirection,
            documentDatabase // Pass document database for context formatting
        );
        
        // Step 8: Display translation results
        showStatus('Translation completed successfully!', 'success');
        
        // Use your existing updateTranslationOutput function with enhanced context
        updateTranslationOutput(
            translationResult.translatedText, 
            translationResult.contextUsed
        );
        
        // Log translation metadata for debugging
        if (config.DEV.DEBUG) {
            console.log('Translation metadata:', translationResult.metadata);
        }
        
    } catch (error) {
        console.error('Translation process failed:', error);
        
        // Enhanced error handling for translation-specific errors
        if (error.message.includes('DeepSeek API')) {
            showStatus('Translation service error - please check your API key', 'error');
        } else if (error.message.includes('embedding server')) {
            showStatus('Embedding server issue - check if server is running', 'error');
        } else if (error.message.includes('No relevant context')) {
            showStatus('No relevant context found in corpus', 'error');
        } else {
            showStatus(`Translation failed: ${error.message}`, 'error');
        }
    }
}

/**
 * Setup info tooltips for similarity options
 */
function setupSimilarityInfoTooltips() {
    const scoringInfo = document.getElementById('scoringInfo');
    const strategyInfo = document.getElementById('strategyInfo');
    
    if (scoringInfo) {
        scoringInfo.addEventListener('click', (e) => {
            e.preventDefault();
            alert(`Advanced Similarity Scoring:

When enabled, the system uses different strategies for each level:
• Documents: Focuses on discourse and functional similarity
• Sections: Balances topical and stylistic similarity  
• Paragraphs: Emphasizes conceptual and terminological similarity

When disabled, uses basic cosine similarity for all levels.`);
        });
    }
    
    if (strategyInfo) {
        strategyInfo.addEventListener('click', (e) => {
            e.preventDefault();
            alert(`Context Strategy Options:

• Balanced: Mixes different types of context for well-rounded translation
• Documents First: Prioritizes document-level context for better discourse understanding
• Paragraphs First: Prioritizes paragraph-level context for better terminology

Recommendation: Use "Balanced" for most translations.`);
        });
    }
}

// =====================================
// RATING SYSTEM SETUP (placeholder for now)
// =====================================

/**
 * Setup rating system (placeholder for future implementation)
 */
function setupRatingSystem() {
    debugLog('Rating system setup - placeholder for future implementation', 'info');
    // Will implement when we add translation functionality
}

/**
 * Submit feedback (placeholder function for the feedback form)
 */
function submitFeedback() {
    showStatus('Feedback system coming soon...', 'success');
    debugLog('Feedback submitted (placeholder)', 'info');
}

// =====================================
// INITIALIZATION (preserving your existing pattern)
// =====================================

/**
 * Initialize the application (matches your existing DOMContentLoaded pattern)
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Pragmatic Auto-Translator initializing...');
    
    try {
        // Setup UI components
        setupLanguageToggle();
        setupTranslateButton();
        setupRatingSystem();
        setupSimilarityInfoTooltips(); // NEW
        
        // Load corpus data
        const corpusLoaded = await loadCorpusData();
        
        if (corpusLoaded) {
            console.log('Initialization complete - ready for similarity search and translation');
        } else {
            console.log('Initialization complete with warnings - some features may not work');
        }
        
    } catch (error) {
        console.error('Initialization failed:', error);
        showStatus('Application initialization failed', 'error');
    }
});

// =====================================
// UTILITY FUNCTIONS (for future modules to use)
// =====================================

/**
 * Get current translation direction
 * @returns {Object} Source and target language codes
 */
export function getCurrentLanguageDirection() {
    return {
        source: currentSourceLang,
        target: currentSourceLang === 'en' ? 'es' : 'en'
    };
}

/**
 * Get loaded vector data (for other modules to access)
 * @returns {Object} Current vectorData
 */
export function getVectorData() {
    return vectorData;
}

/**
 * Get document database (for other modules to access)
 * @returns {Object} Current documentDatabase
 */
export function getDocumentDatabase() {
    return documentDatabase;
}

/**
 * Update translation output (for translation module to use)
 * @param {string} translatedText - Translated text to display
 * @param {Array} contextUsed - Context passages used (optional)
 */
export function updateTranslationOutput(translatedText, contextUsed = []) {
    if (translationOutput) {
        // Display the translation
        translationOutput.innerHTML = `
            <div class="translation-result">
                <h3>Translation:</h3>
                <p class="translated-text">${translatedText}</p>
            </div>
        `;
    }
    
    // Display context information if available - FIXED: Use contextInfo instead of contextDetails
    if (contextUsed && contextUsed.length > 0 && contextInfo) {
        let contextHTML = `
            <div class="context-summary">
                <h4>Context Sources Used:</h4>
            </div>
            <div class="context-items">
        `;
        
        contextUsed.forEach((context, index) => {
            const score = (context.score * 100).toFixed(1);
            contextHTML += `
                <div class="context-item">
                    <div class="context-header">
                        <span class="context-level">${context.level.toUpperCase()}</span>
                        <span class="context-score">${score}% similar</span>
                    </div>
                    <div class="context-title">${context.title || context.document_id || 'Unknown Source'}</div>
                    <div class="context-preview">${truncateText(context.text, 150)}</div>
                </div>
            `;
        });
        
        contextHTML += `</div>`;
        contextInfo.innerHTML = contextHTML;
        
    } else if (contextInfo) {
        // Show message when no context is available
        contextInfo.innerHTML = `
            <p style="color: var(--gray-500); font-style: italic;">
                No relevant context found in corpus for this translation.
            </p>
        `;
    }
    
    debugLog(`✅ Translation and context display updated`, 'info');
}

// Make DeepSeek functions available globally for HTML onclick events and debugging
window.setDeepSeekApiKey = function(apiKey) {
    setDeepSeekApiKey(apiKey);
    storeDeepSeekApiKeyLocally(apiKey);
    showStatus('DeepSeek API key set and stored', 'success');
};

window.testDeepSeek = async function() {
    try {
        showStatus('Testing DeepSeek API...', 'loading');
        const status = await testDeepSeekConnection();
        
        if (status.ready) {
            showStatus('DeepSeek API test successful', 'success');
            console.log('DeepSeek test result:', status);
        } else {
            showStatus(`DeepSeek API test failed: ${status.message}`, 'error');
        }
        
        return status;
    } catch (error) {
        showStatus('DeepSeek API test failed', 'error');
        console.error('DeepSeek API test error:', error);
    }
};

// =====================================
// DEVELOPMENT HELPERS
// =====================================

// Make functions available globally for HTML onclick events
window.submitFeedback = submitFeedback;

// Add embedding test function for debugging
window.testEmbedding = async function() {
    try {
        showStatus('Testing JINA API...', 'loading');
        const status = await getEmbeddingModelStatus();
        showStatus('JINA API test completed', 'success');
        console.log('JINA API status:', status);
        return status;
    } catch (error) {
        showStatus('JINA API test failed', 'error');
        console.error('JINA API test error:', error);
    }
};

// Add function to update API URL for production deployment
window.setJinaApiKey = function(apiKey) {
    setJinaApiKey(apiKey);
    showStatus(`JINA API key set successfully`, 'success');
};

window.storeJinaKey = function(apiKey) {
    storeApiKeyLocally(apiKey);
    showStatus(`JINA API key stored locally`, 'success');
};

// Make key functions available globally for debugging
if (config.DEV.DEBUG) {
    window.PragmaticTranslator = {
        vectorData: () => vectorData,
        documentDatabase: () => documentDatabase,
        currentLanguage: () => currentSourceLang,
        showStatus,
        loadCorpusData,
        submitFeedback,
        // JINA embedding functions
        embeddingStatus: getEmbeddingModelStatus,
        testEmbedding: window.testEmbedding,
        loadEmbeddingModel: loadEmbeddingModel,
        setJinaApiKey: window.setJinaApiKey,
        storeJinaKey: window.storeJinaKey,
        // NEW: DeepSeek translation functions
        setDeepSeekApiKey: window.setDeepSeekApiKey,
        testDeepSeek: window.testDeepSeek,
        isTranslationReady: async () => await isDeepSeekApiReady() // Make it async
    };
    debugLog('Debug helpers with translation functions attached to window.PragmaticTranslator', 'info');
}
