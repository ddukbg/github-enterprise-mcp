import express, { Request, Response } from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { randomUUID } from 'crypto';

// Session-based transport storage
const transportMap = new Map<string, SSEServerTransport>();
// Connection status storage
const connectionStatus = new Map<string, boolean>();

/**
 * Run an MCP server through an HTTP server.
 * 
 * @param server MCP server instance
 * @param port Server port (default: 3000)
 * @returns Express app instance
 */
export async function startHttpServer(server: McpServer, port: number = 3000): Promise<express.Express> {
  const app = express();
  
  // CORS configuration - Allow all origins for development
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // JSON parsing with larger payload sizes
  app.use(express.json({ limit: '10mb' }));
  
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      server: 'GitHub Enterprise MCP',
      version: '1.0.0' 
    });
  });
  
  // Server startup message is now handled in server/index.ts with i18n
  
  // MCP SSE endpoint
  app.get('/sse', async (req: Request, res: Response) => {
    try {
      // Generate session ID
      const sessionId = randomUUID();
      
      if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
        console.log(`New SSE connection: ${sessionId}`);
      }

      // Create endpoint for message handling
      const messageEndpoint = `/messages?sessionId=${sessionId}`;
      
      try {
        // Initialize SSE transport - 트랜스포트가 헤더를 알아서 설정하도록 함
        const transport = new SSEServerTransport(messageEndpoint, res);
        
        // Store for later reference
        transportMap.set(sessionId, transport);
        connectionStatus.set(sessionId, true);
        
        // Connect server to transport
        await server.connect(transport);
        
        // Handle client disconnection
        req.on('close', () => {
          if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
            console.log(`Connection closed: ${sessionId}`);
          }
          
          // Clean up
          connectionStatus.set(sessionId, false);
          transportMap.delete(sessionId);
          
          // Ensure response is properly ended
          if (!res.writableEnded) {
            res.end();
          }
        });
      } catch (err: any) {
        console.error('Failed to initialize SSE transport:', err.message);
        if (!res.headersSent) {
          res.status(500).send('Failed to initialize SSE connection');
        } else {
          // 헤더가 이미 전송된 경우 데이터만 전송
          // If headers are already sent, only send data
          res.write(`data: ${JSON.stringify({ error: 'Transport initialization failed' })}\n\n`);
          res.end();
        }
      }
    } catch (error: any) {
      console.error('SSE connection error:', error.message);
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    }
  });
  
  // Messages endpoint
  app.post('/messages', async (req: Request, res: Response) => {
    try {
      // Extract session ID from query string and clean it
      let sessionId = req.query.sessionId as string;
      
      if (!sessionId) {
        console.error('No session ID provided');
        return res.status(400).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32602,
            message: 'Session ID required'
          }
        });
      }
      
      // 중요: sessionId에서 쿼리스트링 부분 제거
      // URL 형식이 포함된 경우(예: "uuid?sessionId=xxx") 파싱
      // Important: Remove query string part from sessionId
      // Parse if URL format is included (e.g., "uuid?sessionId=xxx")
      if (sessionId.includes('?')) {
        sessionId = sessionId.split('?')[0];
      }
      
      if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
        console.log(`Message received for clean session ${sessionId}:`, JSON.stringify(req.body));
      }
      
      // Validate request body
      if (!req.body) {
        console.error('Empty request body');
        return res.status(400).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32600,
            message: 'Invalid request'
          }
        });
      }
      
      // Get transport for this session
      const transport = transportMap.get(sessionId);
      if (!transport) {
        console.error(`Transport not found for session ${sessionId}`);
        return res.status(404).json({
          jsonrpc: '2.0',
          id: req.body.id || null,
          error: {
            code: -32000,
            message: 'Session not found or expired'
          }
        });
      }
      
      // Verify connection is still active
      const isConnected = connectionStatus.get(sessionId);
      if (!isConnected) {
        console.error(`Connection for session ${sessionId} has been closed`);
        return res.status(400).json({
          jsonrpc: '2.0',
          id: req.body.id || null,
          error: {
            code: -32001,
            message: 'Connection closed'
          }
        });
      }
      
      // Normalize the JSON-RPC request
      const normalizedRequest = {
        jsonrpc: '2.0',
        id: req.body.id !== undefined ? req.body.id : Math.floor(Math.random() * 1000000),
        method: req.body.method,
        params: req.body.params || {}
      };
      
      if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
        console.log('Normalized request:', JSON.stringify(normalizedRequest));
      }
      
      // Process the message
      try {
        await transport.handlePostMessage(req, res, normalizedRequest);
      } catch (err: any) {
        console.error('Message processing error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            id: normalizedRequest.id,
            error: {
              code: -32603,
              message: `Internal error: ${err.message}`
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Message handling error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: 'Internal JSON-RPC error'
          }
        });
      }
    }
  });
  
  // Start server with fallback ports if the default is already in use
  const server1 = app.listen(port, () => {
    console.log(`HTTP server running at http://localhost:${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use, trying ${port + 1}...`);
      // Start server on next port if current is in use
      startHttpServer(server, port + 1);
    } else {
      console.error('Failed to start HTTP server:', err);
    }
  });
  
  // Clean up all connections on server shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server1.close();
    process.exit(0);
  });
  
  return app;
} 
