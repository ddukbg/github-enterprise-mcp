import express from 'express';
import cors from 'cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
// 세션별 트랜스포트 저장소
const transportMap = new Map();
// 연결 상태 저장소
const connectionStatus = new Map();
/**
 * HTTP 서버를 통해 MCP 서버를 실행합니다.
 *
 * @param server MCP 서버 인스턴스
 * @param port 서버 포트 (기본값: 3000)
 * @returns Express 앱 인스턴스
 */
export async function startHttpServer(server, port = 3000) {
    const app = express();
    // CORS 설정
    app.use(cors());
    // JSON 파싱
    app.use(express.json());
    // 상태 확인 엔드포인트
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            server: 'GitHub Enterprise MCP',
            version: '1.0.0'
        });
    });
    // MCP SSE 엔드포인트
    app.get('/sse', async (req, res) => {
        try {
            // 세션 ID 생성 - Cursor에서 제공하는 세션 ID 사용
            const sessionId = req.query.sessionId ||
                Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);
            console.log(`새 SSE 연결 설정: 세션 ID ${sessionId}`);
            // 중요: SDK의 SSEServerTransport가 헤더를 설정할 수 있도록 함
            // SSE 트랜스포트 생성
            const transport = new SSEServerTransport(`/messages?sessionId=${sessionId}`, res);
            // 연결 상태 저장
            connectionStatus.set(sessionId, true);
            transportMap.set(sessionId, transport);
            // 서버에 연결
            await server.connect(transport);
            // 클라이언트 연결 끊김 처리
            req.on('close', () => {
                console.log(`세션 ID ${sessionId} 연결 종료`);
                connectionStatus.set(sessionId, false);
                transportMap.delete(sessionId);
            });
        }
        catch (error) {
            console.error('SSE 연결 설정 오류:', error.message);
            // 이미 헤더가 전송되었을 수 있으므로 try/catch로 오류 방지
            try {
                if (!res.headersSent) {
                    res.status(500).send('Internal Server Error');
                }
            }
            catch { }
        }
    });
    // 메시지 엔드포인트
    app.post('/messages', express.json(), async (req, res) => {
        try {
            // URL에서 sessionId 파라미터 추출
            const urlSessionId = req.query.sessionId;
            if (!urlSessionId) {
                console.error('세션 ID가 없습니다');
                return res.status(400).json({
                    error: '세션 ID가 필요합니다',
                    message: '요청에 유효한 세션 ID가 포함되어 있지 않습니다.'
                });
            }
            // 요청 내용 검증
            if (!req.body || !req.body.method) {
                console.error('잘못된 요청 형식:', JSON.stringify(req.body));
                return res.status(400).json({
                    error: '잘못된 요청 형식',
                    message: '요청에 method 필드가 필요합니다.'
                });
            }
            // URL의 sessionId만 사용
            const cleanSessionId = urlSessionId.split('?')[0];
            console.log(`메시지 처리: 세션 ID ${cleanSessionId}, 메소드: ${req.body.method}`);
            const transport = transportMap.get(cleanSessionId);
            if (!transport) {
                console.error(`세션 ID ${cleanSessionId}에 대한 트랜스포트를 찾을 수 없습니다`);
                console.log('현재 활성 세션 IDs:', Array.from(transportMap.keys()));
                return res.status(404).json({
                    error: '트랜스포트를 찾을 수 없음',
                    message: '이 세션에 대한 활성 연결이 없습니다. 새로고침 후 다시 시도하세요.'
                });
            }
            // 연결 상태 확인
            const isConnected = connectionStatus.get(cleanSessionId);
            if (!isConnected) {
                console.error(`세션 ID ${cleanSessionId}에 대한 연결이 닫혔습니다`);
                return res.status(400).json({
                    error: '연결 종료됨',
                    message: '연결이 종료되었습니다. 새로고침 후 다시 시도하세요.'
                });
            }
            console.log('요청 내용:', JSON.stringify(req.body));
            // SSEServerTransport를 사용하여 메시지 처리
            try {
                // SDK의 handlePostMessage 메서드 사용
                await transport.handlePostMessage(req, res, req.body);
                // handlePostMessage는 자체적으로 응답을 처리하므로 여기서 추가 응답을 보내지 않음
            }
            catch (err) {
                console.error('메시지 처리 오류:', err.message);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: '메시지 처리 실패',
                        message: `메시지 처리 중 오류가 발생했습니다: ${err.message}`
                    });
                }
            }
        }
        catch (error) {
            console.error('메시지 처리 오류:', error.message);
            if (!res.headersSent) {
                res.status(500).json({
                    error: '내부 서버 오류',
                    message: `요청 처리 중 오류가 발생했습니다: ${error.message}`
                });
            }
        }
    });
    // 서버 시작
    const server1 = app.listen(port, () => {
        console.log(`HTTP 서버가 http://localhost:${port}에서 실행 중입니다.`);
    });
    // 서버 종료 시 모든 연결 정리
    process.on('SIGINT', () => {
        console.log('서버 종료 중...');
        server1.close();
        process.exit(0);
    });
    return app;
}
