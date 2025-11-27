import { Metadata } from "@grpc/grpc-js";
import { Body, Controller, Get, Headers, Inject, Ip, Param, Post, UseGuards } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs/internal/firstValueFrom";
import { restoreDates } from "src/common/util/googleTimestamp.util";
import { CurrentUser } from "src/decorators/current-user.decorator";
import { AuthRolesGuard } from "src/guards/auth/auth-roles.guard";
import { AuthGuard } from "src/guards/auth/auth.guard";

@UseGuards(AuthGuard, AuthRolesGuard)
@Controller('exams')
export class ExamsController {
    private examsService;
    
    constructor(@Inject('EXAM_GRPC') private client: ClientGrpc){}

    onModuleInit(){
        this.examsService = this.client.getService('ExamService');
    }

    @Get()
    async getAllStudentExams(@CurrentUser() user: any){
        try {
            const result = await firstValueFrom(this.examsService.GetStudentExams({studentId: user.id})) as any;
            if(!result || !result.exams || result.exams.length === 0){
                return [];
            }
            return restoreDates(result.exams).map(exam => this.parseExamFields(exam));
        } catch (error) {
            console.error('Error fetching student exams:', error);
        }
    }

    @Post('seed')
    async seedExams(){
        const result = await firstValueFrom(this.examsService.SeedExams({})) as any;
        if(!result || !result.exams || result.exams.length === 0){
            return { message: result.message, exams: [] };
        }
        return {
            message: result.message,
            exams: restoreDates(result.exams).map(exam => this.parseExamFields(exam))
        };
    }

    @Post('create')
    async createExam(@Body() data: {
        title: string;
        description?: string;
        courseId: string;
        duration: number;
        totalMarks: number;
        passingMarks: number;
        startTime: string;
        endTime: string;
        questions: any[];
    }){
        const result = await firstValueFrom(this.examsService.CreateExam({
            ...data,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime)
        })) as any;
        return this.parseExamFields(restoreDates(result.exam));
    }

    @Get(':examId')
    async getExam(@Param('examId') examId: string){
        const exam = await firstValueFrom(this.examsService.GetExam({ examId })) as any;
        if(!exam){
            return null;
        }
        return this.parseExamFields(restoreDates(exam));
    }

    @Get('course/:courseId')
    async getCourseExams(@Param('courseId') courseId: string){
        const result = await firstValueFrom(this.examsService.GetCourseExams({ courseId })) as any;

        if(!result || !result.exams || result.exams.length === 0){
            return [];
        }

        return restoreDates(result.exams);
    }

    @Post('session/start')
    async startExamSession(@Body() data: {
        examId: string;
        studentId: string;
    }, @Ip() ipAddress: string, @Headers('user-agent') userAgent: string) {
        const metadata = new Metadata();
        metadata.add('ipAddress', ipAddress);
        metadata.add('userAgent', userAgent);

        const session = await firstValueFrom(this.examsService.StartExamSession(data, metadata)) as any;
        return this.parseSessionFields(restoreDates(session));
    }

    @Get('session/:examId/student')
    async getStudentExamSession(
        @Param('examId') examId: string,
        @CurrentUser() user: any
    ){
        const session = await firstValueFrom(this.examsService.GetStudentExamSession({
            examId,
            studentId: user.studentId
        })) as any;
        if(!session){
            return null;
        }
        return this.parseSessionFields(restoreDates(session));
    }

    @Post('submit')
    async submitExam(@Body() data: {
        sessionId: string;
        studentId: string;
        answers: Array<{
            questionId: string;
            selectedOptions?: string[];
            textAnswer?: string;
            structuredAnswer?: any;
        }>;
    }){
        const result = await firstValueFrom(this.examsService.SubmitExam({
            ...data,
            answers: data.answers.map(answer => ({
                ...answer,
                structuredAnswer: answer.structuredAnswer ? JSON.stringify(answer.structuredAnswer) : undefined
            }))
        })) as any;
        return restoreDates(result);
    }

    @Get('sessions/student')
    async getStudentSessions(@CurrentUser() user: any){
        const result = await firstValueFrom(this.examsService.GetStudentSessions({ studentId: user.studentId })) as any;
        if(!result || !result.sessions || result.sessions.length === 0){
            return [];
        }
        return restoreDates(result.sessions);
    }

    @Get('submissions/:examId')
    async getExamSubmissions(@Param('examId') examId: string){
        const result = await firstValueFrom(this.examsService.GetExamSubmissions({ examId })) as any;
        if(!result || !result.submissions || result.submissions.length === 0){
            return [];
        }
        return restoreDates(result.submissions).map(session => this.parseSessionFields(session));
    }

    @Post('grade')
    async gradeAnswer(@Body() data: {
        answerId: string;
        instructorId: string;
        isCorrect?: boolean;
        marksAwarded: number;
        feedback?: string;
    }){
        const result = await firstValueFrom(this.examsService.GradeAnswer(data)) as any;
        return this.parseAnswerFields(restoreDates(result.answer));
    }

    @Post('verify-student')
    async verifyStudentIdentity(@Body() data: {
        sessionId: string;
        image: string;
    }){
        const result = await firstValueFrom(this.examsService.VerifyStudentIdentity(data)) as any;
        return result;
    }

    private parseQuestionFields(question: any): any {
        if (!question) return question;
        
        return {
            ...question,
            options: question.options ? this.safeJSONParse(question.options) : null,
            correctAnswer: question.correctAnswer ? this.safeJSONParse(question.correctAnswer) : null
        };
    }

    private parseExamFields(exam: any): any {
        if (!exam) return exam;
        
        return {
            ...exam,
            questions: exam.questions?.map(q => this.parseQuestionFields(q)) || []
        };
    }

    private parseAnswerFields(answer: any): any {
        if (!answer) return answer;
        
        return {
            ...answer,
            structuredAnswer: answer.structuredAnswer ? this.safeJSONParse(answer.structuredAnswer) : null,
            question: answer.question ? this.parseQuestionFields(answer.question) : null
        };
    }

    private parseSessionFields(session: any): any {
        if (!session) return session;
        
        return {
            ...session,
            exam: session.exam ? this.parseExamFields(session.exam) : null,
            answers: session.answers?.map(a => this.parseAnswerFields(a)) || []
        };
    }

    private safeJSONParse(value: string): any {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
}