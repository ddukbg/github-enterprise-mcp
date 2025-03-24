import { config } from 'dotenv';
import { z } from 'zod';
// .env 파일에서 환경 변수 로드
config();
// 설정 검증 스키마
const ConfigSchema = z.object({
    baseUrl: z.string().url().default('https://api.github.com'),
    token: z.string().optional(),
    userAgent: z.string().default('mcp-github-enterprise'),
    timeout: z.number().int().positive().default(30000),
    debug: z.boolean().default(false),
});
// 환경 변수 또는 인자에서 설정 로드
export function loadConfig(overrides) {
    // 다양한 환경 변수 이름 지원
    const baseUrl = process.env.GITHUB_ENTERPRISE_URL ||
        process.env.GITHUB_API_URL ||
        process.env.GHE_API_URL ||
        process.env.GITHUB_URL;
    // 명령행 인자 확인
    const args = process.argv;
    let argBaseUrl;
    // baseUrl을 위한 다양한 인자 이름 지원
    for (let i = 0; i < args.length; i++) {
        if ((args[i] === '--github-enterprise-url' ||
            args[i] === '--github-api-url' ||
            args[i] === '--baseUrl') &&
            i + 1 < args.length) {
            argBaseUrl = args[i + 1];
            break;
        }
    }
    // 환경 변수에서 설정 로드
    const environmentConfig = {
        baseUrl: argBaseUrl || baseUrl, // 명령행 인자가 우선
        token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
        userAgent: process.env.GITHUB_USER_AGENT,
        timeout: process.env.GITHUB_TIMEOUT ? parseInt(process.env.GITHUB_TIMEOUT, 10) : undefined,
        debug: process.env.DEBUG === 'true',
    };
    // 설정 로드 디버그 정보
    if (process.env.DEBUG === 'true' || args.includes('--debug')) {
        console.log('설정 로드 정보:');
        console.log(`- 검색된 GitHub API URL: ${environmentConfig.baseUrl || '(없음)'}`);
        console.log(`- 토큰 제공 여부: ${environmentConfig.token ? '예' : '아니오'}`);
        console.log(`- 디버그 모드: ${environmentConfig.debug ? '활성화' : '비활성화'}`);
    }
    // 빈 값 필터링
    const filteredEnvConfig = Object.fromEntries(Object.entries(environmentConfig).filter(([_, v]) => v !== undefined));
    // 모든 설정 소스 병합 (우선순위: 인자 > 환경변수 > 기본값)
    return ConfigSchema.parse({
        ...filteredEnvConfig,
        ...overrides,
    });
}
// 기본 설정 객체
export const defaultConfig = loadConfig();
// GitHub API URL 생성 유틸리티
export function buildApiUrl(config, path) {
    // 이미 전체 URL인 경우 그대로 반환
    if (path.startsWith('http')) {
        return path;
    }
    // 경로가 슬래시로 시작하는 경우, 중복을 방지하기 위해 제거
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    // 기본 URL이 슬래시로 끝나지 않는 경우 추가
    const baseUrl = config.baseUrl.endsWith('/')
        ? config.baseUrl.slice(0, -1)
        : config.baseUrl;
    return `${baseUrl}/${normalizedPath}`;
}
