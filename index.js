import { startServer } from './server/index.js';
// 서버 설정 관련 재내보내기
export * from './utils/config.js';
// 서버 관련 재내보내기
export * from './server/index.js';
// 저장소 API 재내보내기
export * from './api/repos/repository.js';
export * from './api/repos/types.js';
// 관리자 API 재내보내기
export * from './api/admin/admin.js';
export * from './api/admin/types.js';
// 기본 CLI 진입점
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    // CLI 인자 파싱
    const args = process.argv.slice(2);
    const options = {
        config: {}
    };
    // 간단한 인자 파싱
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
                console.warn(`지원하지 않는 transport 타입입니다: ${transportValue}. 'stdio'로 설정합니다.`);
                options.transport = 'stdio';
            }
        }
        else if (arg === '--debug') {
            options.config.debug = true;
        }
        else if (arg === '--help') {
            console.log(`
MCP GitHub Enterprise 서버

사용법:
  npx @modelcontextprotocol/server-github-enterprise [옵션]

옵션:
  --baseUrl <url>              GitHub Enterprise API 기본 URL
                               (기본값: https://api.github.com)
  --github-api-url <url>       GitHub API URL (--baseUrl과 동일)
  --github-enterprise-url <url> GitHub Enterprise URL (--baseUrl과 동일)
  --token <token>              GitHub 개인 액세스 토큰
  --transport <type>           전송 유형 (stdio 또는 http)
                               (기본값: stdio)
  --debug                      디버그 모드 활성화
  --help                       도움말 표시

환경 변수:
  GITHUB_ENTERPRISE_URL        GitHub Enterprise API URL
  GITHUB_API_URL               GitHub API URL
  GITHUB_TOKEN                 GitHub 개인 액세스 토큰
  DEBUG=true                   디버그 모드 활성화
      `);
            process.exit(0);
        }
    }
    console.log('MCP GitHub Enterprise 서버를 시작합니다...');
    if (options.config?.baseUrl) {
        console.log(`사용할 GitHub API URL: ${options.config.baseUrl}`);
    }
    // 서버 시작
    startServer(options).catch(error => {
        console.error('서버 시작 실패:', error);
        process.exit(1);
    });
}
