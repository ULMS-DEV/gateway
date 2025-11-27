import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { restoreDates } from 'src/common/util/googleTimestamp.util';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { RequirePerms } from 'src/decorators/permissions.decorator';
import { AuthRolesGuard } from 'src/guards/auth/auth-roles.guard';
import { AuthGuard } from 'src/guards/auth/auth.guard';

@UseGuards(AuthGuard, AuthRolesGuard)
@Controller('assignments')
export class AssignmentsController {
    private assignmentsService;
      
    constructor(@Inject('ASSIGNMENT_GRPC') private client: ClientGrpc){}
  
    onModuleInit(){
      this.assignmentsService = this.client.getService('AssignmentService');
    }

    // @RequirePerms(ASSIGNMENT)
    @Get('findOne/:id')
    async getAssignmentById(@Param('id') id: string){
      const assignment = await firstValueFrom(this.assignmentsService.getAssignmentById({ id })) as any;
      if(!assignment){
        return null;
      }
      const parsedAssignment = {
        ...assignment,
        submissions: assignment.submissions.map(submission => ({
          ...submission,
          analysisResult: submission.analysisResult ? {
            ...submission.analysisResult,
            plagiarismCheck: JSON.parse(submission.analysisResult.plagiarismCheck),
            grading: JSON.parse(submission.analysisResult.grading)
          } : null
        }))
      };
      return restoreDates(parsedAssignment);
    }

    @Post('create')
    async createAssignment(@Body() createAssignmentDto: { title: string; description: string; dueDate: string; courseId: string }){
      const assignment = await firstValueFrom(this.assignmentsService.createAssignment(createAssignmentDto)) as any;
      return restoreDates(assignment);
    }

    @Get('student')
    async getStudentAssignments(@CurrentUser() user: any){
      const assignments = await firstValueFrom(this.assignmentsService.getStudentAssignments({ studentId: user.id })) as any;
      if(!assignments || !assignments.assignments || assignments.assignments.length === 0){
        return null;
      }
      
      // Parse JSON strings back to objects
      const parsedAssignments = {
        ...assignments,
        assignments: assignments.assignments.map(assignment => ({
          ...assignment,
          submissions: assignment.submissions.map(submission => ({
            ...submission,
            analysisResult: submission.analysisResult ? {
              ...submission.analysisResult,
              plagiarismCheck: JSON.parse(submission.analysisResult.plagiarismCheck),
              grading: JSON.parse(submission.analysisResult.grading)
            } : null
          }))
        }))
      };
      
      return restoreDates(parsedAssignments);
    }

    @Get('course/:courseId')
    async getCourseAssignments(@Param('courseId') courseId: string){
      const assignments = await firstValueFrom(this.assignmentsService.getCourseAssignments({ courseId })) as any;
      if(!assignments || !assignments.assignments || assignments.assignments.length === 0){
        return null;
      }
      
      // Parse JSON strings back to objects
      const parsedAssignments = {
        ...assignments,
        assignments: assignments.assignments.map(assignment => ({
          ...assignment,
          submissions: assignment.submissions.map(submission => ({
            ...submission,
            analysisResult: submission.analysisResult ? {
              ...submission.analysisResult,
              plagiarismCheck: JSON.parse(submission.analysisResult.plagiarismCheck),
              grading: JSON.parse(submission.analysisResult.grading)
            } : null
          }))
        }))
      };
      
      return restoreDates(parsedAssignments);
    }

    @Get(':assignmentId/submissions')
    async getAssignmentSubmissions(@Param('assignmentId') assignmentId: string){
      const result = await firstValueFrom(this.assignmentsService.getAssignmentSubmissions({ assignmentId })) as any;
      if(!result || !result.submissions || result.submissions.length === 0){
        return null;
      }
      
      // Parse JSON strings back to objects
      const parsedSubmissions = {
        ...result,
        submissions: result.submissions.map(submission => ({
          ...submission,
          analysisResult: submission.analysisResult ? {
            ...submission.analysisResult,
            plagiarismCheck: JSON.parse(submission.analysisResult.plagiarismCheck),
            grading: JSON.parse(submission.analysisResult.grading)
          } : null
        }))
      };
      
      return restoreDates(parsedSubmissions);
    }

    @Post('submit/:assignmentId/student')
    async submitAssignment(@Param('assignmentId') assignmentId: string, @Body() {content}: { content: string }, @CurrentUser() user: any){
      const result = await firstValueFrom(this.assignmentsService.submitAssignment({ assignmentId, studentId: user.id, content })) as any;
      return restoreDates(result);
    }
}