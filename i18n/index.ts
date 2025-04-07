import { Config } from '../utils/config.js';

// Import translation files
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define translation object structure
type TranslationNamespace = Record<string, string>;
type TranslationLanguage = Record<string, TranslationNamespace>;

// Helper function to load JSON files
function loadJsonFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading translation file ${filePath}:`, error);
    return {};
  }
}

// Load all translation files
const en_common = loadJsonFile(path.join(__dirname, 'en', 'common.json'));
const en_admin = loadJsonFile(path.join(__dirname, 'en', 'admin.json'));
const en_repos = loadJsonFile(path.join(__dirname, 'en', 'repos.json'));
const en_pulls = loadJsonFile(path.join(__dirname, 'en', 'pulls.json'));
const en_issues = loadJsonFile(path.join(__dirname, 'en', 'issues.json'));

const ko_common = loadJsonFile(path.join(__dirname, 'ko', 'common.json'));
const ko_admin = loadJsonFile(path.join(__dirname, 'ko', 'admin.json'));
const ko_repos = loadJsonFile(path.join(__dirname, 'ko', 'repos.json'));
const ko_pulls = loadJsonFile(path.join(__dirname, 'ko', 'pulls.json'));
const ko_issues = loadJsonFile(path.join(__dirname, 'ko', 'issues.json'));


// Organize translations by language and namespace
const translations: Record<string, TranslationLanguage> = {
  en: {
    common: en_common,
    admin: en_admin,
    repos: en_repos,
    pulls: en_pulls,
    issues: en_issues
  },
  ko: {
    common: ko_common,
    admin: ko_admin,
    repos: ko_repos,
    pulls: ko_pulls,
    issues: ko_issues
  }
};

export class I18n {
  private language: string;
  
  constructor(config: Config) {
    this.language = config.language || 'en';
  }
  
  /**
   * Get a translated string
   * @param namespace The translation namespace (common, admin, repos, etc.)
   * @param key The translation key
   * @param params Optional parameters to replace in the string
   * @returns The translated string
   */
  t(namespace: string, key: string, params?: Record<string, string | number>): string {
    // Get the translation from the specified language and namespace
    const langTranslations = translations[this.language] || translations.en;
    const namespaceTranslations = langTranslations[namespace] || {};
    let text = namespaceTranslations[key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }
    
    return text;
  }
  
  /**
   * Get the current language
   * @returns The current language code
   */
  getLanguage(): string {
    return this.language;
  }
  
  /**
   * Set the language
   * @param language The language code to set
   */
  setLanguage(language: string): void {
    this.language = language === 'ko' ? 'ko' : 'en';
  }
}

// Create a singleton instance
let i18nInstance: I18n | null = null;

export function initializeI18n(config: Config): I18n {
  i18nInstance = new I18n(config);
  return i18nInstance;
}

export function getI18n(): I18n {
  if (!i18nInstance) {
    throw new Error('i18n not initialized. Call initializeI18n first.');
  }
  return i18nInstance;
}
