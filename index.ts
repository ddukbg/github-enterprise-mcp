#!/usr/bin/env node

import { startServer, GitHubServerOptions } from './server/index.js';

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

// Re-export users API
export * from './api/users/users.js';
export * from './api/users/types.js';

// Default CLI entry point
// ES 모듈 환경에서 실행 여부 확인 - NPX 환경 포함
const isDirectRun = process.argv[1] === import.meta.url || 
                    process.argv[1]?.endsWith('/index.js') || 
                    process.argv[1]?.endsWith('\\index.js') ||
                    process.argv[1]?.includes('@ddukbg/github-enterprise-mcp') ||
                    process.argv[0]?.includes('node') ||  // node 명령어로 직접 실행 
                    process.env.npm_execpath?.includes('npx'); // npx로 실행

// 항상 실행되는 디버그 로그 (런타임 진단용)
if (process.env.DEBUG_MCP) {
  console.log('Runtime debug info:');
  console.log('process.argv:', process.argv);
  console.log('import.meta.url:', import.meta.url);
  console.log('isDirectRun:', isDirectRun);
  console.log('process.env.npm_execpath:', process.env.npm_execpath);
}

if (isDirectRun) {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  
  // 디버깅용 로그
  console.log('Command line arguments:', args);
  
  const options: GitHubServerOptions = {
    config: {
      // 환경 변수에서 설정 불러오기
      baseUrl: process.env.GITHUB_ENTERPRISE_URL || process.env.GITHUB_API_URL,
      token: process.env.GITHUB_TOKEN,
      debug: process.env.DEBUG === 'true' || false
    }
  };
  
  // 디버깅용 로그
  console.log('Environment variables:');
  console.log('GITHUB_ENTERPRISE_URL:', process.env.GITHUB_ENTERPRISE_URL || '(none)');
  console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? '(set)' : '(none)');
  
  // Improved argument parsing
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Handle --option=value format
    if (arg.includes('=')) {
      console.log(`Processing argument with =: ${arg}`);
      let [key, value] = arg.split('=', 2);
      
      if (key === '--baseUrl' || key === '--github-api-url' || key === '--github-enterprise-url') {
        console.log(`Setting baseUrl to: ${value}`);
        options.config!.baseUrl = value;
      }
      else if (key === '--token') {
        console.log('Setting token from --token=value format');
        options.config!.token = value;
      }
      else if (key === '--transport') {
        if (value === 'http' || value === 'stdio') {
          console.log(`Setting transport to: ${value}`);
          options.transport = value;
        } else {
          console.warn(`Unsupported transport type: ${value}. Setting to 'stdio'.`);
          options.transport = 'stdio';
        }
      }
      else if (key === '--debug') {
        options.config!.debug = value !== 'false';
      }
      
      continue;
    }
    
    // Handle --option value format
    if (arg === '--baseUrl' && i + 1 < args.length) {
      console.log(`Setting baseUrl to: ${args[i+1]}`);
      options.config!.baseUrl = args[++i];
    }
    else if (arg === '--github-api-url' && i + 1 < args.length) {
      console.log(`Setting baseUrl to: ${args[i+1]}`);
      options.config!.baseUrl = args[++i];
    }
    else if (arg === '--github-enterprise-url' && i + 1 < args.length) {
      console.log(`Setting baseUrl to: ${args[i+1]}`);
      options.config!.baseUrl = args[++i];
    }
    else if (arg === '--token' && i + 1 < args.length) {
      console.log('Setting token from --token value format');
      options.config!.token = args[++i];
    }
    else if (arg === '--transport' && i + 1 < args.length) {
      const transportValue = args[++i];
      if (transportValue === 'http' || transportValue === 'stdio') {
        console.log(`Setting transport to: ${transportValue}`);
        options.transport = transportValue;
      } else {
        console.warn(`Unsupported transport type: ${transportValue}. Setting to 'stdio'.`);
        options.transport = 'stdio';
      }
    }
    else if (arg === '--debug') {
      options.config!.debug = true;
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

  // 설정 상태 확인
  console.log('Final configuration:');
  console.log('baseUrl:', options.config?.baseUrl || '(none)');
  console.log('token:', options.config?.token ? '(set)' : '(none)');
  console.log('transport:', options.transport || 'stdio');
  console.log('debug:', options.config?.debug ? 'true' : 'false');

  console.log('Starting MCP GitHub Enterprise Server...');
  if (options.config?.baseUrl) {
    console.log(`Detected GitHub API URL: ${options.config.baseUrl}`);
  } else {
    console.log(`Detected GitHub API URL: (none)`);
  }
  
  console.log(`Token provided: ${options.config?.token ? 'yes' : 'no'}`);

  // Start server
  startServer(options).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
} 