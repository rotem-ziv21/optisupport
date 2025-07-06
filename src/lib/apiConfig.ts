/**
 * API Configuration for OptiSupport
 * 
 * This file contains configuration settings for API access,
 * allowing switching between direct Supabase access and the backend API.
 */

// Default API settings
const defaultConfig = {
  useBackendApi: false,
  backendUrl: 'http://localhost:5000/api',
  enableLogging: false
};

// Load config from localStorage if available
const loadConfig = (): typeof defaultConfig => {
  try {
    const savedConfig = localStorage.getItem('optisupport_api_config');
    if (savedConfig) {
      return { ...defaultConfig, ...JSON.parse(savedConfig) };
    }
  } catch (error) {
    console.error('Error loading API config:', error);
  }
  return defaultConfig;
};

// Save config to localStorage
const saveConfig = (config: typeof defaultConfig): void => {
  try {
    localStorage.setItem('optisupport_api_config', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving API config:', error);
  }
};

// Current configuration (loaded from localStorage or defaults)
let currentConfig = loadConfig();

/**
 * API Configuration utility
 */
export const apiConfig = {
  /**
   * Get current configuration
   */
  getConfig: () => ({ ...currentConfig }),
  
  /**
   * Update configuration
   */
  updateConfig: (updates: Partial<typeof defaultConfig>) => {
    currentConfig = { ...currentConfig, ...updates };
    saveConfig(currentConfig);
    return currentConfig;
  },
  
  /**
   * Check if backend API should be used
   */
  useBackendApi: () => currentConfig.useBackendApi,
  
  /**
   * Get backend API URL
   */
  getBackendUrl: () => currentConfig.backendUrl,
  
  /**
   * Toggle between backend API and direct Supabase
   */
  toggleBackendApi: () => {
    currentConfig.useBackendApi = !currentConfig.useBackendApi;
    saveConfig(currentConfig);
    return currentConfig.useBackendApi;
  },
  
  /**
   * Reset configuration to defaults
   */
  resetConfig: () => {
    currentConfig = { ...defaultConfig };
    saveConfig(currentConfig);
    return currentConfig;
  }
};
