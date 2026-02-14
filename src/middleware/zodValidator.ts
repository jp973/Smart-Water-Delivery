import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { exitPoint } from "./exitPoint";

export const validate = (schema: z.ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        const data = validatedData as {
            body?: unknown;
            query?: unknown;
            params?: unknown;
        };
        // Update request with validated data
        if (data.body) req.body = data.body;
        if (data.query) {
            Object.keys(req.query).forEach(key => delete (req.query as Record<string, unknown>)[key]);
            Object.entries(data.query as Record<string, unknown>).forEach(([key, value]) => {
                (req.query as Record<string, unknown>)[key] = value;
            });
        }
        if (data.params) {
            Object.keys(req.params).forEach(key => delete (req.params as Record<string, unknown>)[key]);
            Object.entries(data.params as Record<string, unknown>).forEach(([key, value]) => {
                (req.params as Record<string, unknown>)[key] = value;
            });
        }

        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Define a loose type to access properties common to various Zod issue subtypes
            // without fighting the discriminated union types directly
            type ValidationIssue = {
                code: string;
                path: (string | number)[];
                message: string;
                received?: string | number;
                expected?: string;
                type?: string;
                options?: string[];
            };

            const firstIssue = error.issues[0] as unknown as ValidationIssue;
            const field = firstIssue.path
                .filter((p: string | number) => p !== "body" && p !== "query" && p !== "params")
                .join(".");
            let toastMessage = firstIssue.message;

            // Handle common Zod error codes for better user feedback
            if (firstIssue.code === "invalid_type") {
                if (String(firstIssue.received) === "undefined" || String(firstIssue.received) === "null") {
                    toastMessage = `${field || "Value"} is required`;
                } else {
                    toastMessage = `Invalid format for ${field || "value"}. Expected ${firstIssue.expected}, but got ${firstIssue.received}`;
                }
            } else if (firstIssue.code === "too_small" && firstIssue.type === "string") {
                toastMessage = `${field || "Field"} cannot be empty`;
            } else if (firstIssue.code === "invalid_enum_value") {
                const options = firstIssue.options || [];
                toastMessage = `Invalid value for ${field || "field"}. Expected one of: ${options.join(", ")}`;
            }

            const combinedMessage = error.issues
                .map(i => {
                    const issue = i as unknown as ValidationIssue;
                    const f = issue.path
                        .filter((p: string | number) => p !== "body" && p !== "query" && p !== "params")
                        .join(".");
                    if (issue.code === "invalid_type") {
                        return `${f || "Value"} should be ${issue.expected}`;
                    }
                    return issue.message;
                })
                .join(", ");

            req.apiStatus = {
                isSuccess: false,
                message: combinedMessage,
                data: error.issues,
                toastMessage: toastMessage,
            };
            return exitPoint(req, res);
        }
        next(error);
    }
};
