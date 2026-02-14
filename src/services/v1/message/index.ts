import { config } from "../../../config/v1/config";

interface MessagingService {
  sendOTP: (
    phone: string,
    countryCode: string,
    otp: string,
  ) => Promise<{ success: boolean; messageID: string }>;
  // sendMessage: (phone: string, countryCode: string, message: string) => Promise<{ success: boolean; messageID: string }>;
}

export async function getMessagingService(): Promise<MessagingService> {
  const messageService = config.MESSAGE_SERVICE;

  let messagingService: MessagingService;

  if (messageService === "WhatsApp") {
    messagingService = await import("./whatsapp");
  } else {
    throw new Error("Messaging service not supported");
  }

  return messagingService;
}
