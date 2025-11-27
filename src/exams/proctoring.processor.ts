import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import axios from 'axios';

export interface ProctoringJobData {
  image: string;
  reference_image?: string;
  clientId: string;
  timestamp: number;
}

@Processor('proctoring')
export class ProctoringProcessor {
  private readonly logger = new Logger(ProctoringProcessor.name);
  private readonly PROCTORING_API_URL = 'https://v4lv7m3w-8000.euw.devtunnels.ms/api/proctoring/detect-cheating';

  @Process('detect-cheating')
  async handleDetectCheating(job: Job<ProctoringJobData>) {
    const { image, reference_image, clientId, timestamp } = job.data;
    console.log('Received job data:', { imageLength: image.length, referenceImageLength: reference_image?.length });
    
    this.logger.log(
      `Processing job ${job.id} from client ${clientId} (queued: ${Date.now() - timestamp}ms ago)`
    );

    try {
      // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const cleanImage = image.includes(',') ? image.split(',')[1] : image;
      const cleanReferenceImage = reference_image?.includes(',') ? reference_image.split(',')[1] : reference_image;

      // Convert base64 to Buffer
      const imageBuffer = Buffer.from(cleanImage, 'base64');
      const referenceImageBuffer = cleanReferenceImage ? Buffer.from(cleanReferenceImage, 'base64') : null;

      console.log('Sending to API:', { 
        imageBufferLength: imageBuffer.length, 
        referenceImageBufferLength: referenceImageBuffer?.length,
      });

      // Create FormData
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('image', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });

      if (referenceImageBuffer) {
        formData.append('reference_image', referenceImageBuffer, {
          filename: 'reference.jpg',
          contentType: 'image/jpeg',
        });
      }

      const response = await axios.post(
        this.PROCTORING_API_URL,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'x-auth-token': process.env.PROCTORING_AUTH_TOKEN || '',
          },
          timeout: 60000,
        }
      );

      this.logger.log(
        `Successfully processed job ${job.id} from client ${clientId}. Response: ${response.status}`
      );
      console.log('Proctoring API response data:', response.data);

      return { success: true, status: response.status };
    } catch (error) {
      this.logger.error(
        `Failed to process job ${job.id} from client ${clientId}: ${error.message}`,
        error.stack
      );

      console.log('Proctoring API error response:', error.response?.data || error.message);
      
      return { success: false, error: error.message };
    }
  }
}
