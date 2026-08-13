import { BrandsService } from './brands.service';
export declare class BrandsController {
    private readonly brandsService;
    constructor(brandsService: BrandsService);
    check(name: string): Promise<{
        isAnalyzed: boolean;
        name?: undefined;
    } | {
        name: string;
        isAnalyzed: boolean;
    }>;
    markAnalyzed(name: string): Promise<{
        id: number;
        name: string;
        isAnalyzed: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | {
        error: string;
    }>;
}
