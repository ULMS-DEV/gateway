import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs/internal/firstValueFrom";
import { fromTimestamp, restoreDates } from "src/common/util/googleTimestamp.util";

@Controller('courses')
export class CoursesController {
    private coursesService;
    
    constructor(@Inject('COURSE_GRPC') private client: ClientGrpc){}

    onModuleInit(){
        this.coursesService = this.client.getService('CourseService');
    }

    @Get()
    async getAllCourses(){
        const {courses} = await firstValueFrom(this.coursesService.getAllCourses({})) as { courses: any[] };
        if(!courses || courses.length === 0){
            return [];
        }
        return restoreDates(courses);
    }

    @Get(':id')
    async getCourseById(@Param('id') id: string){
        const course = await firstValueFrom(this.coursesService.getCourseById({id})) as any;
        if(!course){
            return null;
        }
        return restoreDates(course);
    }

    @Post('create')
    createCourse(@Body() data: { title: string; code: string; description: string; instructorId: string }){
        return this.coursesService.createCourse(data);
    }

    @Post('enroll')
    async enrollStudent(@Body() data: { courseId: string; studentId: string; semester: string; year: number }){
        return this.coursesService.createCourseOffer(data);
    }

    @Get('enrollments/:studentId')
    async getEnrollmentsByStudentId(@Param('studentId') studentId: string){
        const {offers} = await firstValueFrom(this.coursesService.getOffersForStudent({studentId})) as { offers: any[] };
        if(!offers || offers.length === 0){
            return [];
        }
        return restoreDates(offers);
    }
}