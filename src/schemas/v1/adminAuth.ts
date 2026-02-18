import { z } from "zod";

export const adminLoginSchema = z.object({
    body: z.object({
        email: z.string().trim().email("Valid email is required"),
        password: z.string().min(6, "Password is required"),
    }),
});

export const refreshAdminTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().trim().min(1, "Refresh token is required"),
    }),
});

export const updateAdminProfileSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, "Name is required"),
    }),
});
