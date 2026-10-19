import { PrismaService } from '../prisma/prisma.service.js';
import { SupplierStatus, CommunicationType } from '@prisma/client';
export declare class SuppliersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        name: string;
        website?: string;
        country?: string;
        email?: string;
        phone?: string;
        notes?: string;
    }): Promise<{
        id: number;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupplierStatus;
        website: string | null;
        country: string | null;
        phone: string | null;
        rejectionReason: string | null;
        notes: string | null;
        lastContactAt: Date | null;
    }>;
    findAll(status?: SupplierStatus): Promise<({
        communications: {
            date: Date;
        }[];
        _count: {
            contacts: number;
        };
    } & {
        id: number;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupplierStatus;
        website: string | null;
        country: string | null;
        phone: string | null;
        rejectionReason: string | null;
        notes: string | null;
        lastContactAt: Date | null;
    })[]>;
    findById(id: number): Promise<({
        contacts: {
            id: number;
            email: string | null;
            name: string;
            role: string | null;
            createdAt: Date;
            phone: string | null;
            supplierId: number;
            isPrimary: boolean;
        }[];
        communications: {
            id: number;
            createdAt: Date;
            date: Date;
            supplierId: number;
            type: import("@prisma/client").$Enums.CommunicationType;
            summary: string;
            nextAction: string | null;
            nextActionDate: Date | null;
        }[];
        _count: {
            supplierProducts: number;
            purchases: number;
        };
    } & {
        id: number;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupplierStatus;
        website: string | null;
        country: string | null;
        phone: string | null;
        rejectionReason: string | null;
        notes: string | null;
        lastContactAt: Date | null;
    }) | null>;
    updateStatus(id: number, data: {
        status: SupplierStatus;
        notes?: string;
        rejectionReason?: string;
    }): Promise<{
        id: number;
        email: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SupplierStatus;
        website: string | null;
        country: string | null;
        phone: string | null;
        rejectionReason: string | null;
        notes: string | null;
        lastContactAt: Date | null;
    }>;
    addContact(supplierId: number, data: {
        name: string;
        role?: string;
        email?: string;
        phone?: string;
        isPrimary?: boolean;
    }): Promise<{
        id: number;
        email: string | null;
        name: string;
        role: string | null;
        createdAt: Date;
        phone: string | null;
        supplierId: number;
        isPrimary: boolean;
    }>;
    updateContact(id: number, data: {
        name?: string;
        role?: string;
        email?: string;
        phone?: string;
        isPrimary?: boolean;
    }): Promise<{
        id: number;
        email: string | null;
        name: string;
        role: string | null;
        createdAt: Date;
        phone: string | null;
        supplierId: number;
        isPrimary: boolean;
    }>;
    deleteContact(id: number): Promise<{
        id: number;
        email: string | null;
        name: string;
        role: string | null;
        createdAt: Date;
        phone: string | null;
        supplierId: number;
        isPrimary: boolean;
    }>;
    addCommunication(supplierId: number, data: {
        type: CommunicationType;
        summary: string;
        nextAction?: string;
        nextActionDate?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        date: Date;
        supplierId: number;
        type: import("@prisma/client").$Enums.CommunicationType;
        summary: string;
        nextAction: string | null;
        nextActionDate: Date | null;
    }>;
    getFunnelStats(): Promise<{
        total: number;
        statuses: {
            status: import("@prisma/client").$Enums.SupplierStatus;
            count: number;
        }[];
    }>;
}
