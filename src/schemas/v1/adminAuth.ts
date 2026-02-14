import { z } from "zod";

export const sendAdminOTPSchema = z.object({
    body: z.object({
        countryCode: z.string().trim().min(1, "Country code is required"),
        phone: z.string().trim().min(1, "Phone number is required"),
    }),
});

export const verifyAdminOTPSchema = z.object({
    body: z.object({
        countryCode: z.string().trim().min(1, "Country code is required"),
        phone: z.string().trim().min(1, "Phone number is required"),
        otp: z.string().trim().min(1, "OTP is required"),
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
