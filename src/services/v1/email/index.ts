import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../../../utils/v1/logger";

let cachedTransporter: Transporter | null = null;

const buildTransporter = (): Transporter => {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  logger.warn("SMTP credentials missing; using jsonTransport (emails will not be sent)");
  cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
  return cachedTransporter;
};

export const sendEmail = async (to: string, subject: string, text: string): Promise<boolean> => {
  try {
    const transporter = buildTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@smartwater.local",
      to,
      subject,
      text,
    });
    return true;
  } catch (error) {
    logger.error({ err: error }, "Failed to send email");
    return false;
  }
};
