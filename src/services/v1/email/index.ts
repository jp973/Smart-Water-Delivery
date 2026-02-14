// import sendEmailWithResend from "./resend";
// import { config } from "../../../config/v1/config";
// import { logger } from "../../../utils/v1/logger";

// export async function sendEmail(
//   toEmail: string,
//   mjmlTemplate: string, 
//   ccAddresses: string[] = [],
//   bccAddresses: string[] = [],
//   emailContent: Record<string, string>,
// ): Promise<boolean> {
//   const serviceProvider = config.SERVICE_PROVIDER;

//   try {
//     let sendResult: boolean;

//     if (serviceProvider === "resendService") {
//       sendResult = await sendEmailWithResend(toEmail, mjmlTemplate, ccAddresses, bccAddresses, emailContent);
//     } else {
//       throw new Error("Unknown email service provider.");
//     }

//     return sendResult;
//   } catch (error) {
//     logger.error({ data: error }, "Failed to send email:");
//     return false;
//   }
// }
