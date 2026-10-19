import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    login(user: {
        id: number;
        email: string;
        role: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: number;
            email: string;
            role: string;
        };
    }>;
    register(email: string, password: string, name: string): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
