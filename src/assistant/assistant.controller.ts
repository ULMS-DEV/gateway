import { Body, Controller, Get, Inject, Param, Post, Res } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs/internal/firstValueFrom";
import type { Response } from 'express';

@Controller('assistant')
export class AssistantController {
    private assistantAgent;
    
    constructor(@Inject('ASSISTANT_GRPC') private client: ClientGrpc){}

    onModuleInit(){
        this.assistantAgent = this.client.getService('AssistantAgent');
    }

    @Get('start-session')
    async startAssistantSession(){
        const result = await firstValueFrom(this.assistantAgent.StartChatSession({})) as any;
        return result;
    }

    @Post('send-message/:chatId')
    async sendMessageToAssistant(@Param('chatId') chatId: string, @Body() data: { question: string; courseId: string; courseTitle: string }){
        const payload = {
            ...data,
            chatId
        }
        const result = await firstValueFrom(this.assistantAgent.InquireAssistant(payload)) as any;
        const parsedResult = {
            ...result,
            sources: result.data.sources != '[]' ? JSON.parse(result.data.sources) : []
        }
        return parsedResult;
    }

    @Post('send-message-stream/:chatId')
    async sendMessageToAssistantStream(
        @Param('chatId') chatId: string,
        @Body() data: { question: string; courseId: string; courseTitle: string },
        @Res() res: Response,
    ) {
        const payload = {
            ...data,
            chatId,
        };

        // Set headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        try {
            const stream = this.assistantAgent.InquireAssistantStream(payload);

            stream.subscribe({
                next: (response: { chunk: string }) => {
                    // Each chunk is a JSON string with type and data
                    res.write(`data: ${response.chunk}\n\n`);
                },
                error: (error) => {
                    console.error('Stream error:', error);
                    res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
                    res.end();
                },
                complete: () => {
                    res.end();
                },
            });
        } catch (error) {
            res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
            res.end();
        }
    }
}