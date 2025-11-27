import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs/internal/firstValueFrom";
import { restoreDates } from "src/common/util/googleTimestamp.util";
import { CurrentUser } from "src/decorators/current-user.decorator";
import { RequirePerms } from "src/decorators/permissions.decorator";
import { AuthRolesGuard } from "src/guards/auth/auth-roles.guard";
import { AuthGuard } from "src/guards/auth/auth.guard";
import { PERMS } from "ulms-contracts";

@UseGuards(AuthGuard, AuthRolesGuard)
@Controller('courses')
export class CoursesController {
    private coursesService;
    
    constructor(@Inject('COURSE_GRPC') private client: ClientGrpc){}

    onModuleInit(){
        this.coursesService = this.client.getService('CourseService');
    }

    @RequirePerms(PERMS.COURSE_READ)
    @Get()
    async getAllCourses(){
        const {courses} = await firstValueFrom(this.coursesService.getAllCourses({})) as { courses: any[] };
        if(!courses || courses.length === 0){
            return [];
        }
        return restoreDates(courses);
    }

    @RequirePerms(PERMS.COURSE_READ)
    @Get('findOne/:id')
    async getCourseById(@Param('id') id: string){
        const course = await firstValueFrom(this.coursesService.getCourseById({id})) as any;
        if(!course){
            return null;
        }
        return restoreDates(course);
    }

    @RequirePerms(PERMS.COURSE_CREATE)
    @Post('create')
    createCourse(@Body() data: { title: string; code: string; description: string; instructorId: string }){
        return this.coursesService.createCourse(data);
    }

    @RequirePerms(PERMS.ENROLLMENT_CREATE)
    @Post('enroll')
    async enrollStudent(@Body() data: { courseId: string; studentId: string; semester: string; year: number }){
        return this.coursesService.createCourseOffer(data);
    }

    @RequirePerms(PERMS.COURSE_READ)
    @Get('enrollments')
    async getEnrollmentsByStudentId(@CurrentUser() user: any){
        const {offers} = await firstValueFrom(this.coursesService.getOffersForStudent({studentId: user.id})) as { offers: any[] };
        if(!offers || offers.length === 0){
            return [];
        }
        return restoreDates(offers);
    }
}