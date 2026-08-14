import { PrismaService } from '../prisma/prisma.service';
export declare class DistributorsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        name: string;
        website?: string;
        brandName?: string;
        isPrivateLabel?: boolean;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        website: string | null;
    }>;
}
