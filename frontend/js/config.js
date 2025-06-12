// =====================================
// PRAGMATIC AUTO-TRANSLATOR CONFIG
// =====================================

// Model Configuration
export const MODELS = {
  EMBEDDING: {
    name: 'jina-embeddings-v3',
    dimension: 1024,
    transformersId: 'jinaai/jina-embeddings-v3'
  },
};

// Corpus Configuration - Dynamic Path Configuration
// Detect environment and set base path
const isGitHubPages = window.location.hostname.includes('github.io');
const repoName = 'pragmatic-auto-translator-demo-test'; // Update this to match your actual repo name
const basePath = isGitHubPages ? `/${repoName}` : '.';

console.log(`Environment: ${isGitHubPages ? 'GitHub Pages' : 'Local'}, Base path: ${basePath}`);

// Corpus Configuration  
export const CORPUS = {
  // Domain currently implemented: Generative AI
  DOMAIN: 'gai', // Update this to match your domain code
  
  // Vector file paths (dynamic for both local and GitHub Pages environments)
  // Update these to match your file paths and names
  VECTOR_PATHS: {
    document: `${basePath}/vectors/gai/gai-document-vectors.json`,
    section: `${basePath}/vectors/gai/gai-section-vectors.json`, 
    paragraph: `${basePath}/vectors/gai/gai-paragraph-vectors.json`
  },
  
  // Database paths (dynamic for both local and GitHub Pages environments)
  // Update these to match your file paths and names
  DATABASE_PATHS: {
    en: `${basePath}/corpora/gai/eng/gai-eng_database.json`,
    es: `${basePath}/corpora/gai/esp/gai-esp_database.json`
  }
};

// Similarity Search Configuration
export const SIMILARITY = {
  // How many similar items to retrieve at each level
  // Can be updated to reflect your preferences
  TOP_K: {
    document: 3,    // Top 3 most similar documents
    section: 5,     // Top 5 most similar sections  
    paragraph: 8    // Top 8 most similar paragraphs
  },
  
  // Minimum similarity thresholds (0-1 scale) - starting low for small corpora
  // Can be increased once larger corpora have been integrated
  MIN_THRESHOLD: {
    document: 0.1,  // Lower threshold for document-level with a few documents
    section: 0.15,
    paragraph: 0.2
  },
  
  // Maximum total context length to send to translation API
  // The number can be updated to reflect your preferences while keeping within DeepSeek context window usages
  MAX_CONTEXT_LENGTH: 10000, // characters (context passages, not full docs)

  // Similarity strategy options
  STRATEGIES: {
    useAdvancedScoring: true,    // Enable level-specific scoring
    defaultPriorityStrategy: 'balanced'  // 'balanced', 'documents-first', 'paragraphs-first'
  }
};

// UI Configuration
export const UI = {
  // Supported language directions
  LANGUAGES: {
    en: { name: 'English' },
    es: { name: 'Spanish' }
  },
  
  // Default translation direction
  DEFAULT_DIRECTION: {
    source: 'en',
    target: 'es'
  },
  
  // Status messages
  STATUS: {
    LOADING_VECTORS: 'Loading corpus vectors...',
    LOADING_MODEL: 'Loading embedding model...',
    CREATING_EMBEDDINGS: 'Creating embeddings...',
    SEARCHING_CORPUS: 'Searching corpus for context...',
    TRANSLATING: 'Translating with context...',
    COMPLETE: 'Translation complete',
    ERROR: 'Translation error occurred'
  }
};

// Language Code Mapping
export const LANGUAGE_MAPPING = {
  // Your 3-letter ISO codes → API 2-letter codes
  TO_API_CODES: {
    eng: 'en',
    esp: 'es'
  },
  
  // API 2-letter codes → Your 3-letter ISO codes  
  FROM_API_CODES: {
    en: 'eng',
    es: 'esp'
  }
};

// Development Configuration
export const DEV = {
  // Enable console logging for debugging
  DEBUG: true,
  
  // Show detailed similarity scores in UI
  SHOW_SIMILARITY_SCORES: true,
  
  // Cache strategy: vectors only (not full text) for faster similarity search
  CACHE_VECTORS_ONLY: true,
  
  // Maximum cache age in milliseconds (24 hours)
  CACHE_MAX_AGE: 24 * 60 * 60 * 1000
};

// Error Configuration
export const ERRORS = {
  NETWORK: 'Network error - please check your connection',
  MODEL_LOAD: 'Could not load embedding model',
  VECTOR_LOAD: 'Could not load corpus vectors',
  TRANSLATION_API: 'Translation service unavailable',
  NO_CONTEXT: 'No relevant context found in corpus',
  INVALID_INPUT: 'Please enter text to translate'
};

// Export default configuration object
export default {
  MODELS,
  CORPUS,
  SIMILARITY,
  UI,
  LANGUAGE_MAPPING,
  DEV,
  ERRORS
};
