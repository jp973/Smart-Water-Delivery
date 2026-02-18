import { z } from "zod";

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, "Name is required"),
        email: z.string().trim().email("Valid email is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        countryCode: z.string().trim().min(1, "Country code is required"),
        phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
        address: z.object({
            houseNo: z.string().trim().min(1, "House number is required"),
            street: z.string().trim().min(1, "Street is required"),
            area: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid Area ID format"),
            city: z.string().trim().min(1, "City is required"),
            pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits"),
            landmark: z.string().optional().nullable(),
        }),
        waterQuantity: z.number().min(0, "Water quantity cannot be negative"),
        notes: z.string().optional().nullable(),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().trim().min(1, "User ID is required"),
    }),
    body: z.object({
        name: z.string().trim().min(1, "Name cannot be empty").optional(),
        email: z.string().trim().email("Valid email is required").optional(),
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
        countryCode: z.string().trim().min(1, "Country code is required").optional(),
        phone: z.string().trim().min(10, "Phone number must be at least 10 digits").optional(),
        address: z.object({
            houseNo: z.string().trim().min(1).optional(),
            street: z.string().trim().min(1).optional(),
            area: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid Area ID format").optional(),
            city: z.string().trim().min(1).optional(),
            pincode: z.string().trim().regex(/^\d{6}$/).optional(),
            landmark: z.string().optional().nullable(),
        }).optional(),
        waterQuantity: z.number().min(0).optional(),
        notes: z.string().optional().nullable(),
        isEnabled: z.boolean().optional(),
    }),
});

export const deleteUserSchema = z.object({
    params: z.object({
        id: z.string().trim().min(1, "User ID is required"),
    }),
});

export const getUserByIdSchema = z.object({
    params: z.object({
        id: z.string().trim().min(1, "User ID is required"),
    }),
});

export const getAllUserSchema = z.object({
    body: z.object({
        options: z.object({
            page: z.number().min(1).default(1),
            itemsPerPage: z.number().min(1).default(10),
            sortBy: z.array(z.string()).default(["createdAt"]),
            sortDesc: z.array(z.boolean()).default([true]),
        }).optional(),
        project: z.record(z.string(), z.number()).optional(),
        filters: z.object({
            isEnabled: z.boolean().optional(),
            city: z.string().optional(),
            area: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
            waterQuantity: z.number().optional(),
        }).optional(),
        search: z.array(z.object({
            term: z.string().optional().default(""),
            fields: z.array(z.string()),
            startsWith: z.boolean().optional().default(false),
            endsWith: z.boolean().optional().default(false),
        })).optional(),
        areaId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    }),
});

