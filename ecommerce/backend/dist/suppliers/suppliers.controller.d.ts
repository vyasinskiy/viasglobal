import { SuppliersService } from './suppliers.service.js';
import { SupplierStatus, CommunicationType } from '@prisma/client';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    create(body: {
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
    getFunnelStats(): Promise<{
        total: number;
        statuses: {
            status: import("@prisma/client").$Enums.SupplierStatus;
            count: number;
        }[];
    }>;
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
    updateStatus(id: number, body: {
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
    addContact(supplierId: number, body: {
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
    updateContact(contactId: number, body: {
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
    deleteContact(contactId: number): Promise<{
        id: number;
        email: string | null;
        name: string;
        role: string | null;
        createdAt: Date;
        phone: string | null;
        supplierId: number;
        isPrimary: boolean;
    }>;
    addCommunication(supplierId: number, body: {
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
}
