import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { ProctoringJobData } from './proctoring.processor';
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/proctoring',
})
export class ProctoringGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProctoringGateway.name);
  private referenceImageBase64: string | null;

  constructor(
    @InjectQueue('proctoring') private readonly proctoringQueue: Queue<ProctoringJobData>
  ) {}

  onModuleInit() {
    // Load reference image on module initialization
    try {
      // Use path.resolve to get absolute path to src directory
      const referenceImagePath = path.resolve(process.cwd(), 'src', 'reference.jpg');
      const imageBuffer = fs.readFileSync(referenceImagePath);
      this.referenceImageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      this.logger.log(`Reference image loaded successfully from ${referenceImagePath}`);
    } catch (error) {
      this.logger.error(`Failed to load reference image: ${error.message}`);
      this.referenceImageBase64 = null;
    }
  }

  @SubscribeMessage('submit-images')
  async handleImages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { image: string }
  ): Promise<void> {
    try {
      this.logger.log(`Received images from client ${client.id}`);
      console.log('Data received:', data.image.length);
      
      // Add job to queue with the loaded reference image
      const job = await this.proctoringQueue.add('detect-cheating', {
        image: data.image,
        reference_image: this.referenceImageBase64 || undefined,
        clientId: client.id,
        timestamp: Date.now(),
      }, {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay
        },
        removeOnComplete: true, // Clean up completed jobs
        removeOnFail: false, // Keep failed jobs for debugging
      });
      
      this.logger.log(`Queued job ${job.id} for client ${client.id}`);
      
      // No response sent back to client
    } catch (error) {
      this.logger.error(
        `Error queueing images from client ${client.id}: ${error.message}`,
        error.stack
      );
      // Silently fail - no response to client
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
