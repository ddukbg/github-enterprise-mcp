import { startServer } from './server/index.js';
// Re-export config utilities
export * from './utils/config.js';
// Re-export server components
export * from './server/index.js';
// Re-export repository API
export * from './api/repos/repository.js';
export * from './api/repos/types.js';
// Re-export admin API
export * from './api/admin/admin.js';
export * from './api/admin/types.js';
// Re-export issues API
export * from './api/issues/issues.js';
export * from './api/issues/types.js';
// Re-export actions API
export * from './api/actions/actions.js';
export * from './api/actions/types.js';
// Default CLI entry point
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    // Parse CLI arguments
    const args = process.argv.slice(2);
    const options = {
        config: {}
    };
    // Simple argument parsing
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--baseUrl' && i + 1 < args.length) {
            options.config.baseUrl = args[++i];
        }
        else if (arg === '--github-api-url' && i + 1 < args.length) {
            options.config.baseUrl = args[++i];
        }
        else if (arg === '--github-enterprise-url' && i + 1 < args.length) {
            options.config.baseUrl = args[++i];
        }
        else if (arg === '--token' && i + 1 < args.length) {
            options.config.token = args[++i];
        }
        else if (arg === '--transport' && i + 1 < args.length) {
            const transportValue = args[++i];
            if (transportValue === 'http' || transportValue === 'stdio') {
                options.transport = transportValue;
            }
            else {
                console.warn(`Unsupported transport type: ${transportValue}. Setting to 'stdio'.`);
                options.transport = 'stdio';
            }
        }
        else if (arg === '--debug') {
            options.config.debug = true;
        }
        else if (arg === '--help') {
            console.log(`
MCP GitHub Enterprise Server

Usage:
  npx @modelcontextprotocol/server-github-enterprise [options]

Options:
  --baseUrl <url>              GitHub Enterprise API base URL
                               (default: https://api.github.com)
  --github-api-url <url>       GitHub API URL (same as --baseUrl)
  --github-enterprise-url <url> GitHub Enterprise URL (same as --baseUrl)
  --token <token>              GitHub personal access token
  --transport <type>           Transport type (stdio or http)
                               (default: stdio)
  --debug                      Enable debug mode
  --help                       Show this help

Environment Variables:
  GITHUB_ENTERPRISE_URL        GitHub Enterprise API URL
  GITHUB_API_URL               GitHub API URL
  GITHUB_TOKEN                 GitHub personal access token
  DEBUG=true                   Enable debug mode
      `);
            process.exit(0);
        }
    }
    console.log('Starting MCP GitHub Enterprise Server...');
    if (options.config?.baseUrl && (options.config?.debug || args.includes('--debug'))) {
        console.log(`GitHub API URL: ${options.config.baseUrl}`);
    }
    // Start server
    startServer(options).catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
