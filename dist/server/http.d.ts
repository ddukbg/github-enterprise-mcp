import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Run an MCP server through an HTTP server.
 *
 * @param server MCP server instance
 * @param port Server port (default: 3000)
 * @returns Express app instance
 */
export declare function startHttpServer(server: McpServer, port?: number): Promise<express.Express>;
