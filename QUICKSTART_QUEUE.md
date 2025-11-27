# Quick Start: Proctoring Queue System

## Prerequisites

1. **Redis** must be installed and running
2. **Node.js** 18+ and **pnpm**

## Setup Steps

### 1. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install redis-server
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 2. Verify Redis

```bash
redis-cli ping
# Should output: PONG
```

### 3. Configure Environment

Copy the example env file:
```bash
cp .env.example .env
```

Edit `.env` if needed (default values should work for local development):
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Start the Gateway

```bash
pnpm run dev
```

You should see:
```
[Nest] INFO [ProctoringGateway] WebSocket server initialized
```

## Testing

### Option 1: HTML Test Client

Open `test-proctoring-websocket.html` in your browser:
```bash
# macOS
open test-proctoring-websocket.html

# Linux
xdg-open test-proctoring-websocket.html

# Windows
start test-proctoring-websocket.html
```

1. Click "Connect"
2. Select an image
3. Click "Submit Images"
4. Check terminal for queue logs

### Option 2: Camera Client

Create `camera-test.html` with the code from `nextjs-example/proctoring-camera.html`:
1. Open in browser
2. Click "Start Proctoring"
3. Grant camera permissions
4. Watch images being sent at 2 FPS

### Option 3: Command Line

```bash
# Install socket.io-client globally
npm install -g socket.io-client

# Use in Node.js
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:3000/proctoring');
socket.on('connect', () => {
  console.log('Connected');
  socket.emit('submit-images', { image: 'test-base64-data' });
  console.log('Image sent');
});
"
```

## Monitoring

### Check Logs

The terminal will show:
```
[ProctoringGateway] Client connected: xyz123
[ProctoringGateway] Received images from client xyz123
[ProctoringGateway] Queued job 1 for client xyz123
[ProctoringProcessor] Processing job 1 from client xyz123
[ProctoringProcessor] Successfully processed job 1
```

### Check Queue in Redis

```bash
# Number of waiting jobs
redis-cli LLEN "bull:proctoring:wait"

# Number of active jobs
redis-cli LLEN "bull:proctoring:active"

# Number of completed jobs
redis-cli LLEN "bull:proctoring:completed"

# Number of failed jobs
redis-cli LLEN "bull:proctoring:failed"
```

### Monitor Redis Real-time

```bash
redis-cli monitor
```

## Expected Flow

1. **Client connects** → `Client connected: xyz123`
2. **Client sends image** → `Received images from client xyz123`
3. **Image queued** → `Queued job 1 for client xyz123`
4. **Worker picks up job** → `Processing job 1 from client xyz123`
5. **API call made** → (external API receives image)
6. **Job completed** → `Successfully processed job 1`

## Troubleshooting

### Redis Not Running

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start it
sudo systemctl start redis-server  # Linux
brew services start redis           # macOS
```

### WebSocket Not Connecting

**Error:** Connection timeout or refused

**Solution:**
- Check if gateway is running: `pnpm run dev`
- Verify port 3000 is not in use: `lsof -i :3000`
- Check CORS settings if connecting from different domain

### Jobs Not Processing

**Check queue status:**
```bash
redis-cli LLEN "bull:proctoring:wait"
```

If jobs are stuck in waiting:
1. Check if processor is registered (look for `ProctoringProcessor` in logs)
2. Restart the server
3. Check for errors in logs

### High Memory Usage

If Redis is using too much memory:
```bash
# Check Redis memory
redis-cli INFO memory

# Clear all queues (caution!)
redis-cli FLUSHDB
```

## Production Deployment

### 1. Update Environment Variables

```env
NODE_ENV=production
REDIS_HOST=your-redis-server.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
```

### 2. Use Redis Cluster (for high availability)

```env
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379
```

### 3. Enable TLS for Redis

```typescript
redis: {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: true
  }
}
```

### 4. Configure CORS

Update `proctoring.gateway.ts`:
```typescript
@WebSocketGateway({
  cors: {
    origin: 'https://your-frontend-domain.com',
    credentials: true,
  },
  namespace: '/proctoring',
})
```

### 5. Add Queue Monitoring

Install Bull Board:
```bash
pnpm add @bull-board/api @bull-board/express
```

See `docs/QUEUE_SYSTEM.md` for setup instructions.

## Performance Tips

1. **Reduce image quality** to decrease bandwidth and queue size
2. **Increase worker concurrency** for faster processing
3. **Monitor queue length** and scale workers if needed
4. **Use CDN** if serving static files
5. **Enable compression** on WebSocket connection

## Next Steps

- Read `docs/QUEUE_SYSTEM.md` for advanced features
- Read `docs/PROCTORING_WEBSOCKET.md` for client examples
- Implement authentication/authorization
- Add rate limiting per user
- Set up monitoring and alerts

## Support

For issues or questions:
1. Check logs in terminal
2. Check Redis queue status
3. Review documentation in `docs/`
4. Check NestJS Bull documentation: https://docs.nestjs.com/techniques/queues
