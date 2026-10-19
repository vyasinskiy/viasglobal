import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: number;
            email: string;
            role: string;
        };
    } | {
        status: string;
        message: string;
    }>;
    register(body: {
        email: string;
        password: string;
        name: string;
    }): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
