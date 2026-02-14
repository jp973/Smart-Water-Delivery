import { z } from "zod";

export const createAreaSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, "Name is required"),
        description: z.string().trim().optional(),
        city: z.string().trim().min(1, "City is required"),
        pincode: z
            .string()
            .trim()
            .regex(/^\d{6}$/, "Pincode must be a 6-digit number"),
    }),
});

export const updateAreaSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Area ID is required"),
    }),
    body: z.object({
        name: z.string().trim().optional(),
        description: z.string().trim().optional(),
        city: z.string().trim().optional(),
        pincode: z
            .string()
            .trim()
            .regex(/^\d{6}$/, "Pincode must be a 6-digit number")
            .optional(),
    }),
});

export const getAreaByIdSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Area ID is required"),
    }),
});

export const getAllAreaSchema = z.object({
    body: z.object({
        filters: z.record(z.string(), z.unknown()).optional().default({}),
        options: z.object({
            page: z.number().int().positive().default(1),
            itemsPerPage: z.number().int().positive().default(10),
            sortBy: z.array(z.string()).optional(),
            sortDesc: z.array(z.boolean()).optional(),
        }).optional().default({ page: 1, itemsPerPage: 10 }),
        project: z.record(z.string(), z.union([z.number(), z.boolean()])).optional(),
        search: z.array(z.object({
            term: z.string(),
            fields: z.array(z.string()),
            startsWith: z.boolean().optional(),
            endsWith: z.boolean().optional(),
        })).optional(),
    }).optional().default({ filters: {}, options: { page: 1, itemsPerPage: 10 } }),
});
