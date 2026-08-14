import { PrismaService } from '../prisma/prisma.service';
export declare class BrandsService {
    private prisma;
    constructor(prisma: PrismaService);
    checkBrandAnalyzed(name: string): Promise<{
        isAnalyzed: boolean;
        isPrivateLabel: boolean;
    }>;
    markAsAnalyzed(name: string): Promise<{
        id: number;
        name: string;
        isAnalyzed: boolean;
        isPrivateLabel: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
