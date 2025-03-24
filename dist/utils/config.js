import { config } from 'dotenv';
import { z } from 'zod';
// Load environment variables from .env file
config();
// Configuration validation schema
const ConfigSchema = z.object({
    baseUrl: z.string().url().default('https://api.github.com'),
    token: z.string().optional(),
    userAgent: z.string().default('mcp-github-enterprise'),
    timeout: z.number().int().positive().default(30000),
    debug: z.boolean().default(false),
});
// Load configuration from environment variables or arguments
export function loadConfig(overrides) {
    // Support various environment variable names
    const baseUrl = process.env.GITHUB_ENTERPRISE_URL ||
        process.env.GITHUB_API_URL ||
        process.env.GHE_API_URL ||
        process.env.GITHUB_URL;
    // Check command line arguments
    const args = process.argv;
    let argBaseUrl;
    // Support various argument names for baseUrl
    for (let i = 0; i < args.length; i++) {
        if ((args[i] === '--github-enterprise-url' ||
            args[i] === '--github-api-url' ||
            args[i] === '--baseUrl') &&
            i + 1 < args.length) {
            argBaseUrl = args[i + 1];
            break;
        }
    }
    // Load configuration from environment variables
    const environmentConfig = {
        baseUrl: argBaseUrl || baseUrl, // Command line arguments take precedence
        token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
        userAgent: process.env.GITHUB_USER_AGENT,
        timeout: process.env.GITHUB_TIMEOUT ? parseInt(process.env.GITHUB_TIMEOUT, 10) : undefined,
        debug: process.env.DEBUG === 'true',
    };
    // Debug configuration loading information
    if (process.env.DEBUG === 'true' || args.includes('--debug')) {
        console.log(`Detected GitHub API URL: ${environmentConfig.baseUrl || '(none)'}`);
        console.log(`Token provided: ${environmentConfig.token ? 'yes' : 'no'}`);
    }
    // Filter out undefined values
    const filteredEnvConfig = Object.fromEntries(Object.entries(environmentConfig).filter(([_, v]) => v !== undefined));
    // Merge all configuration sources (priority: args > env vars > defaults)
    return ConfigSchema.parse({
        ...filteredEnvConfig,
        ...overrides,
    });
}
// Default configuration object
export const defaultConfig = loadConfig();
// GitHub API URL generation utility
export function buildApiUrl(config, path) {
    // Return as-is if it's already a full URL
    if (path.startsWith('http')) {
        return path;
    }
    // Remove leading slash to prevent duplication
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    // Add trailing slash to base URL if it doesn't exist
    const baseUrl = config.baseUrl.endsWith('/')
        ? config.baseUrl.slice(0, -1)
        : config.baseUrl;
    return `${baseUrl}/${normalizedPath}`;
}
