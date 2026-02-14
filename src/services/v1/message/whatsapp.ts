import axios from "axios";
import { config } from "../../../config/v1/config";
import { logger } from "../../../utils/v1/logger";

export const sendOTP = async (
  phone: string,
  countryCode: string,
  otp: string,
): Promise<{ success: boolean; messageID: string }> => {
  try {
    const response = await axios.post(
      config.WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to: `${countryCode}${phone}`,
        type: "template",
        template: {
          name: "authentication_code_copy_code_button",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: otp }],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                {
                  type: "text",
                  text: `${otp}`,
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.WHATSAPP_AUTH_TOKEN}`,
        },
      },
    );
    return { success: true, messageID: response?.data?.data?.data?.messages?.[0]?.id || "unknown" };
  } catch (error) {
    logger.error({ error }, "Error sending OTP via WhatsApp API:");
    return { success: false, messageID: "unknown" };
  }
};

export const sendMessage = async (
  phone: string,
  countryCode: string,
  message: string,
): Promise<{ success: boolean; messageID: string }> => {
  try {
    const response = await axios.post(
      config.WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: `${countryCode}${phone}`,
        type: "text",
        text: {
          preview_url: true,
          body: message,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.WHATSAPP_AUTH_TOKEN}`,
        },
      },
    );
    return { success: true, messageID: response?.data?.data?.data?.messages?.[0]?.id || "unknown" };
  } catch (error) {
    console.log("error", error);

    logger.error({ error }, "Error sending message via WhatsApp API:");
    return { success: false, messageID: "unknown" };
  }
};
