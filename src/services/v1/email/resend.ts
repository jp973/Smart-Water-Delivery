// import { Resend } from "resend";
// import { config } from "../../../config/v1/config";
// import mjml2html from "mjml";
// import fs from "fs";
// import path from "path";
// import { logger } from "../../../utils/v1/logger";

// if (!config.RESEND_API_KEY || config.RESEND_API_KEY.trim() === "") {
//   logger.error({ data: "RESEND_API_KEY is missing or empty" }, "Resend configuration error:");
//   throw new Error("RESEND_API_KEY is not configured. Please set it in your .env file.");
// }

// const resend = new Resend(config.RESEND_API_KEY);

// export default async function sendEmailWithResend(
//   toEmail: string,
//   mjmlTemplate: string, 
//   ccAddresses: string[] = [],
//   bccAddresses: string[] = [],
//   emailContent: Record<string, string> = {},
// ): Promise<boolean> {
//   try {
//     const templatePath = path.join(__dirname, "../../../templates/v1/mjml", mjmlTemplate);
//     const fileExtension = path.extname(templatePath).toLowerCase();

//     let templateRaw = fs.readFileSync(templatePath, "utf-8");

//     Object.entries(emailContent).forEach(([key, value]) => {
//       const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
//       templateRaw = templateRaw.replace(regex, value);
//     });

//     let html: string;
//     if (fileExtension === ".mjml") {
//       const { html: compiledHtml, errors } = mjml2html(templateRaw);
//       if (errors.length) {
//         logger.error({ data: errors }, "MJML parsing errors:");
//         return false;
//       }
//       html = compiledHtml;
//     } else if (fileExtension === ".html" || fileExtension === ".htm") {
//       html = templateRaw;
//     } else {
//       logger.error({ data: { templatePath, fileExtension } }, "Unsupported email template format:");
//       return false;
//     }

//     logger.info({ data: toEmail }, "toEmail");
//     const result = await resend.emails.send({
//       from: `Sainik Sethu <${config.RESEND_FROM}>`, //"Your App <onboarding@resend.dev>",
//       to: toEmail,
//       subject: emailContent.subject || "Email from Resend", // fallback subject
//       html,
//       cc: ccAddresses.length ? ccAddresses : undefined,
//       bcc: bccAddresses.length ? bccAddresses : undefined,
//     });

//     if (result.error) {
//       // Provide more detailed error information
//       const errorMessage = result.error.message || "Unknown error";
//       const errorCode = result.error.name || "unknown_error";
      
//       if (errorCode === "validation_error" && errorMessage.includes("API key")) {
//         logger.error(
//           { 
//             data: result.error,
//             hint: "Please verify RESEND_API_KEY in your .env file is correct and starts with 're_'"
//           }, 
//           "Resend email failed - Invalid API Key:"
//         );
//       } else {
//         logger.error({ data: result.error }, "Resend email failed:");
//       }
//       return false;
//     }
//     logger.info({ data: result }, "Resend email sent:");
//     return true;
//   } catch (err) {
//     logger.error({ data: err }, "Resend email failed:");
//     return false;
//   }
// }
