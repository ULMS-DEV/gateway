# Proctoring Queue System

## Overview

The proctoring system now uses **Bull Queue** with **Redis** to process images asynchronously. This prevents blocking the WebSocket connection and allows for better scalability and reliability.

## Architecture

```
Client (Camera) → WebSocket → Gateway → Queue → Worker → External API
                                 ↓
                              Redis
```

### Flow:
1. **Client** sends images via WebSocket at 2 FPS
2. **Gateway** receives images and adds them to the queue (non-blocking)
3. **Redis** stores the queue jobs
4. **Worker** processes jobs from the queue
5. **Worker** forwards images to external proctoring API
6. Failed jobs are retried automatically

## Features

✅ **Non-blocking**: Images are queued instantly, no waiting for API response  
✅ **Automatic Retries**: Failed jobs retry up to 3 times with exponential backoff  
✅ **Scalable**: Multiple workers can process the queue in parallel  
✅ **Reliable**: Jobs persist in Redis, surviving server restarts  
✅ **Monitoring**: Queue statistics and job status available  
✅ **Clean**: Completed jobs are automatically removed  

## Requirements

### Redis Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional: Redis authentication
# REDIS_PASSWORD=your_password
```

### Queue Settings

Current configuration in `exams.module.ts`:

```typescript
BullModule.registerQueue({
  name: 'proctoring',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    removeOnComplete: true,    // Clean up completed jobs
    attempts: 3,               // Retry 3 times on failure
  },
})
```

### Job Options

Each job is configured with:

```typescript
{
  attempts: 3,                  // Retry up to 3 times
  backoff: {
    type: 'exponential',        // 2s, 4s, 8s delays
    delay: 2000,
  },
  removeOnComplete: true,       // Delete after success
  removeOnFail: false,          // Keep for debugging
}
```

## Usage

### Starting the Server

```bash
# Make sure Redis is running
redis-cli ping

# Start the gateway
npm run dev
```

### Monitoring Queue

You can monitor the queue using Bull Board (optional):

```bash
pnpm add @bull-board/api @bull-board/express
```

Then add to your app:

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullAdapter(proctoringQueue)],
  serverAdapter,
});

serverAdapter.setBasePath('/admin/queues');
app.use('/admin/queues', serverAdapter.getRouter());
```

Access at: `http://localhost:3000/admin/queues`

### Redis CLI Monitoring

```bash
# Monitor Redis commands in real-time
redis-cli monitor

# Check queue length
redis-cli LLEN "bull:proctoring:wait"

# View queue keys
redis-cli KEYS "bull:proctoring:*"
```

## Performance

### Throughput

With the queue system:
- **WebSocket latency**: < 5ms (instant queueing)
- **Processing rate**: Depends on external API (~1-2 requests/second typical)
- **Queue capacity**: Limited by Redis memory (millions of jobs possible)

### Scaling Workers

To increase processing speed, you can:

1. **Increase concurrency** in the processor:
```typescript
@Processor('proctoring', { concurrency: 5 })
export class ProctoringProcessor {
  // Will process 5 jobs simultaneously
}
```

2. **Run multiple server instances** (all workers pull from same Redis queue)

3. **Horizontal scaling**: Deploy multiple gateway instances

### Memory Usage

- Each job: ~100-500 KB (depends on image size/quality)
- 1000 queued jobs: ~100-500 MB in Redis
- Consider reducing image quality if queue grows large

## Error Handling

### Job Failures

Failed jobs are:
1. Retried automatically (3 attempts)
2. Kept in Redis for inspection (check failed jobs)
3. Logged with full error details

### Viewing Failed Jobs

```bash
# Get failed job count
redis-cli LLEN "bull:proctoring:failed"

# Get failed job IDs
redis-cli LRANGE "bull:proctoring:failed" 0 -1
```

Or programmatically:

```typescript
const failedJobs = await proctoringQueue.getFailed();
console.log(failedJobs);
```

## Troubleshooting

### Queue Not Processing

**Check Redis connection:**
```bash
redis-cli ping
```

**Check queue status:**
```typescript
const jobCounts = await proctoringQueue.getJobCounts();
console.log(jobCounts);
// { waiting: 10, active: 2, completed: 100, failed: 5 }
```

### High Queue Backlog

If queue is growing faster than processing:

1. **Increase concurrency**
2. **Optimize image size/quality**
3. **Add more worker instances**
4. **Check external API performance**

### Redis Connection Issues

```typescript
// Add connection event handlers
proctoringQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

proctoringQueue.on('waiting', (jobId) => {
  console.log('Job waiting:', jobId);
});
```

## Production Considerations

### Redis Persistence

Enable Redis persistence in `redis.conf`:

```conf
save 900 1      # Save after 900s if 1 key changed
save 300 10     # Save after 300s if 10 keys changed
save 60 10000   # Save after 60s if 10000 keys changed
```

### Redis Cluster

For high availability, use Redis Cluster:

```typescript
BullModule.registerQueue({
  name: 'proctoring',
  redis: {
    cluster: [
      { host: 'redis-1', port: 6379 },
      { host: 'redis-2', port: 6379 },
      { host: 'redis-3', port: 6379 },
    ],
  },
})
```

### Monitoring

Set up monitoring for:
- Queue length
- Processing rate
- Failed job rate
- Redis memory usage
- Worker CPU/memory

### Security

```typescript
BullModule.registerQueue({
  name: 'proctoring',
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD, // Add authentication
    tls: {}, // Enable TLS in production
  },
})
```

## Testing

### Send Test Job

```typescript
// Add test endpoint
@Get('test-queue')
async testQueue() {
  const job = await this.proctoringQueue.add('detect-cheating', {
    image: 'test-image-data',
    clientId: 'test-client',
    timestamp: Date.now(),
  });
  return { jobId: job.id };
}
```

### Monitor Job Progress

```bash
# Watch logs
npm run dev

# In another terminal, send images
# Watch the logs show:
# 1. "Received images from client..."
# 2. "Queued job X for client..."
# 3. "Processing job X..."
# 4. "Successfully processed job X..."
```

## Advanced Features

### Rate Limiting

Limit jobs per client:

```typescript
const jobsFromClient = await proctoringQueue.getJobs(['waiting', 'active'])
  .then(jobs => jobs.filter(j => j.data.clientId === client.id));

if (jobsFromClient.length > 10) {
  throw new Error('Too many pending jobs');
}
```

### Priority Queue

Give some jobs higher priority:

```typescript
await this.proctoringQueue.add('detect-cheating', data, {
  priority: 1, // Higher priority (lower number = higher priority)
});
```

### Delayed Processing

Delay job processing:

```typescript
await this.proctoringQueue.add('detect-cheating', data, {
  delay: 5000, // Process after 5 seconds
});
```

### Job Events

Listen to job events:

```typescript
proctoringQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

proctoringQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
```
