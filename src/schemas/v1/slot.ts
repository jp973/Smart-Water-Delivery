import { z } from "zod";
import { EXTRA_REQUEST_STATUS, SLOT_STATUS, SUBSCRIPTION_STATUS } from "../../utils/v1/constants";

export const createSlotSchema = z.object({
    body: z.object({
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
        startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid startTime format",
        }),
        endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid endTime format",
        }),
        areaId: z.string().min(1, "Area ID is required"),
        capacity: z.number().int().positive("Capacity must be a positive integer"),
        bookingCutoffTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid bookingCutoffTime format",
        }),
    }),
});

export const updateSlotSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Slot ID is required"),
    }),
    body: z.object({
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }).optional(),
        startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid startTime format",
        }).optional(),
        endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid endTime format",
        }).optional(),
        areaId: z.string().optional(),
        capacity: z.number().int().positive().optional(),
        bookingCutoffTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid bookingCutoffTime format",
        }).optional(),
        status: z.nativeEnum(SLOT_STATUS).optional(),
        isActive: z.boolean().optional(),
    }),
});

export const getSlotByIdSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Slot ID is required"),
    }),
});

export const getAllSlotSchema = z.object({
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

export const requestExtraQuantitySchema = z.object({
    body: z.object({
        quantity: z.number().positive("Quantity must be a positive number"),
    }),
});

export const cancelSubscriptionSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Subscription ID is required"),
    }),
    body: z.object({
        status: z.enum([SUBSCRIPTION_STATUS.CANCELLED]),
    }),
});

export const updateExtraRequestStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Subscription ID is required"),
    }),
    body: z.object({
        status: z.nativeEnum(EXTRA_REQUEST_STATUS),
    }),
});

export const getPendingExtraRequestsSchema = z.object({
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

export const updateSubscriptionStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Subscription ID is required"),
    }),
    body: z.object({
        status: z.enum([SUBSCRIPTION_STATUS.DELIVERED, SUBSCRIPTION_STATUS.MISSED]),
    }),
});

export const getUserSlotHistorySchema = z.object({
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
