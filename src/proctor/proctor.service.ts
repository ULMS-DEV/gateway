import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";

@Injectable()
export class ProctorService implements OnModuleInit {
    private proctorService;

    constructor(@Inject('PROCTOR_GRPC') private client: ClientGrpc){}

    onModuleInit(){
        this.proctorService = this.client.getService('ProctorService');
    }

    detectCheating(image: Buffer, referenceImage?: Buffer){
        const request = {
            image: new Uint8Array(image),
            reference_image: referenceImage ? new Uint8Array(referenceImage) : undefined,
        };

        return this.proctorService.detectCheating(request);
    }
}