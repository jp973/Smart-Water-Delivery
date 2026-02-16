import { z } from "zod";

export const registerUserSchema = z.object({
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

export const userLoginSchema = z.object({
    body: z.object({
        email: z.string().trim().email("Valid email is required"),
        password: z.string().min(6, "Password is required"),
    }),
});

export const refreshUserTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().trim().min(1, "Refresh token is required"),
    }),
});

export const updateUserProfileSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, "Name is required").optional(),
        address: z.object({
            houseNo: z.string().trim().min(1, "House number is required").optional(),
            street: z.string().trim().min(1, "Street is required").optional(),
            area: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid Area ID format").optional(),
            city: z.string().trim().min(1, "City is required").optional(),
            pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits").optional(),
            landmark: z.string().optional().nullable(),
        }).optional(),
        waterQuantity: z.number().min(0, "Water quantity cannot be negative").optional(),
        notes: z.string().optional().nullable(),
    }),
});

export const sendForgotPasswordOTPSchema = z.object({
    body: z.object({
        email: z.string().trim().email("Valid email is required"),
    }),
});

export const verifyForgotPasswordOTPSchema = z.object({
    body: z.object({
        email: z.string().trim().email("Valid email is required"),
        otp: z.string().trim().min(1, "OTP is required"),
    }),
});

export const updatePasswordWithOTPSchema = z.object({
    body: z.object({
        email: z.string().trim().email("Valid email is required"),
        otp: z.string().trim().min(1, "OTP is required"),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
    }),
});
