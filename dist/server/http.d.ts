import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * HTTP 서버를 통해 MCP 서버를 실행합니다.
 *
 * @param server MCP 서버 인스턴스
 * @param port 서버 포트 (기본값: 3000)
 * @returns Express 앱 인스턴스
 */
export declare function startHttpServer(server: McpServer, port?: number): Promise<express.Express>;
