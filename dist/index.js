#!/usr/bin/env node
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
// ES 모듈 환경에서 실행 여부 확인 - require 사용하지 않음
const isDirectRun = process.argv[1] === import.meta.url || process.argv[1]?.endsWith('github-enterprise-mcp/dist/index.js');
if (isDirectRun) {
    // Parse CLI arguments
    const args = process.argv.slice(2);
    const options = {
        config: {
            // 환경 변수에서 설정 불러오기 (명령줄 인수보다 우선순위 낮음)
            baseUrl: process.env.GITHUB_ENTERPRISE_URL || process.env.GITHUB_API_URL,
            token: process.env.GITHUB_TOKEN,
            debug: process.env.DEBUG === 'true' || false
        }
    };
    // Improved argument parsing - supports both --option value and --option=value formats
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        // Handle --option=value format
        if (arg.includes('=')) {
            const [key, value] = arg.split('=');
            if (key === '--baseUrl' || key === '--github-api-url' || key === '--github-enterprise-url') {
                options.config.baseUrl = value;
            }
            else if (key === '--token') {
                options.config.token = value;
            }
            else if (key === '--transport') {
                if (value === 'http' || value === 'stdio') {
                    options.transport = value;
                }
                else {
                    console.warn(`Unsupported transport type: ${value}. Setting to 'stdio'.`);
                    options.transport = 'stdio';
                }
            }
            else if (key === '--debug') {
                options.config.debug = value !== 'false';
            }
            continue;
        }
        // Handle --option value format
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
  npx @ddukbg/github-enterprise-mcp [options]

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
    if (options.config?.baseUrl) {
        console.log(`Detected GitHub API URL: ${options.config.baseUrl}`);
    }
    else {
        console.log(`Detected GitHub API URL: (none)`);
    }
    console.log(`Token provided: ${options.config?.token ? 'yes' : 'no'}`);
    // Start server
    startServer(options).catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
