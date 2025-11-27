import { BadRequestException, Controller, Post, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProctorService } from "./proctor.service";
import { lastValueFrom } from "rxjs";

@Controller('proctor')
export class ProctorController {
    constructor(private readonly proctorService: ProctorService){}

    @Post('detect-cheating')
    @UseInterceptors(
        FileFieldsInterceptor([
        { name: 'image', maxCount: 1 },
        { name: 'reference_image', maxCount: 1 },
        ]),
    )
    async detectCheating(
        @UploadedFiles()
        files: {
            image?: Express.Multer.File[];
            reference_image?: Express.Multer.File[];
        },
    ) {
        if (!files?.image?.[0] || !files.reference_image?.[0]) {
            throw new BadRequestException('Both images are required');
        }

        const image = files.image[0].buffer;
        const reference_image = files.reference_image[0].buffer;

        const result = await lastValueFrom(
            this.proctorService.detectCheating(image, reference_image),
        );

        return result;
    }
}