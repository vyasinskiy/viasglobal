import { BrandsService } from './brands.service';
export declare class BrandsController {
    private readonly brandsService;
    constructor(brandsService: BrandsService);
    check(name: string): Promise<{
        isAnalyzed: boolean;
        isPrivateLabel: boolean;
    } | {
        isAnalyzed: boolean;
        isPrivateLabel: boolean;
        name: string;
    }>;
    markAnalyzed(name: string): Promise<{
        id: number;
        name: string;
        isAnalyzed: boolean;
        isPrivateLabel: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | {
        error: string;
    }>;
}
