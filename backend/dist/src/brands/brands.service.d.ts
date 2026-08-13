import { PrismaService } from '../prisma/prisma.service';
export declare class BrandsService {
    private prisma;
    constructor(prisma: PrismaService);
    checkBrandAnalyzed(name: string): Promise<boolean>;
    markAsAnalyzed(name: string): Promise<{
        id: number;
        name: string;
        isAnalyzed: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
