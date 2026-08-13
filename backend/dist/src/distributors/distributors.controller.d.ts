import { DistributorsService } from './distributors.service';
export declare class DistributorsController {
    private readonly distributorsService;
    constructor(distributorsService: DistributorsService);
    create(body: any): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        website: string | null;
    }>;
}
