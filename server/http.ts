import express, { Request, Response } from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

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
  
  // CORS configuration
  app.use(cors());
  
  // JSON parsing
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      server: 'GitHub Enterprise MCP',
      version: '1.0.0' 
    });
  });
  
  // MCP SSE endpoint
  app.get('/sse', async (req: Request, res: Response) => {
    try {
      // Generate session ID - use session ID provided by Cursor
      const sessionId = req.query.sessionId as string || 
                        Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
      
      if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
        console.log(`New SSE connection: ${sessionId}`);
      }

      // Important: Allow SDK's SSEServerTransport to set headers
      // Create SSE transport
      const transport = new SSEServerTransport(`/messages?sessionId=${sessionId}`, res);
      
      // Store connection status
      connectionStatus.set(sessionId, true);
      transportMap.set(sessionId, transport);
      
      // Connect to server
      await server.connect(transport);
      
      // Handle client disconnection
      req.on('close', () => {
        if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
          console.log(`Connection closed: ${sessionId}`);
        }
        connectionStatus.set(sessionId, false);
        transportMap.delete(sessionId);
      });
    } catch (error: any) {
      console.error('SSE connection error:', error.message);
      // Prevent errors in case headers have already been sent
      try {
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error');
        }
      } catch {}
    }
  });
  
  // Messages endpoint
  app.post('/messages', express.json(), async (req: Request, res: Response) => {
    try {
      // Extract sessionId parameter from URL
      const urlSessionId = req.query.sessionId as string;
      
      if (!urlSessionId) {
        console.error('No session ID provided');
        return res.status(400).json({ 
          error: 'Session ID required',
          message: 'The request does not include a valid session ID.'
        });
      }
      
      // Validate request content
      if (!req.body || !req.body.method) {
        console.error('Invalid request format:', JSON.stringify(req.body));
        return res.status(400).json({
          error: 'Invalid request format',
          message: 'The request must include a method field.'
        });
      }
      
      // Use only sessionId from URL
      const cleanSessionId = urlSessionId.split('?')[0];
      
      if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
        console.log(`Message: ${cleanSessionId}, method: ${req.body.method}`);
      }
      
      const transport = transportMap.get(cleanSessionId);
      if (!transport) {
        console.error(`Transport not found for session ${cleanSessionId}`);
        if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
          console.log('Active sessions:', Array.from(transportMap.keys()));
        }
        return res.status(404).json({ 
          error: 'Transport not found',
          message: 'No active connection exists for this session. Please refresh and try again.'
        });
      }
      
      // Check connection status
      const isConnected = connectionStatus.get(cleanSessionId);
      if (!isConnected) {
        console.error(`Connection for session ${cleanSessionId} has been closed`);
        return res.status(400).json({ 
          error: 'Connection closed',
          message: 'The connection has been closed. Please refresh and try again.'
        });
      }
      
      if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
        console.log('Request body:', JSON.stringify(req.body));
      }
      
      // Process message using SSEServerTransport
      try {
        // Use SDK's handlePostMessage method
        await transport.handlePostMessage(req, res, req.body);
        // handlePostMessage handles the response itself, so no additional response should be sent here
      } catch (err: any) {
        console.error('Message processing error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Message processing failed',
            message: `An error occurred while processing the message: ${err.message}`
          });
        }
      }
    } catch (error: any) {
      console.error('Message handling error:', error.message);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error',
          message: `An error occurred while processing the request: ${error.message}`
        });
      }
    }
  });
  
  // Start server
  const server1 = app.listen(port, () => {
    console.log(`HTTP server running at http://localhost:${port}`);
  });
  
  // Clean up all connections on server shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server1.close();
    process.exit(0);
  });
  
  return app;
} 