// @ts-ignore
import { TelegramClient } from "telegram/browser";
import { StringSession } from "telegram/sessions";
import { Buffer } from "buffer";

export interface TelegramConfig {
  apiId: number;
  apiHash: string;
}

let client: TelegramClient | null = null;

export const getTelegramClient = (config: TelegramConfig, sessionString: string = "") => {
  const stringSession = new StringSession(sessionString);
  
  if (!client) {
    client = new TelegramClient(stringSession, config.apiId, config.apiHash, {
      connectionRetries: 5,
    });
  }
  
  return client;
};

export const generateQrCode = async (
  config: TelegramConfig,
  onQrCode: (qr: { token: Buffer; expires: number }) => void,
  onSuccess: (session: string) => void,
  onError: (error: any) => void
) => {
  try {
    const client = getTelegramClient(config);
    
    // Conecta se não estiver conectado
    if (!client.connected) {
      await client.connect();
    }

    await client.signInUserWithQrCode(
      { apiId: config.apiId, apiHash: config.apiHash },
      {
        onError: async (err) => {
          console.error("QR Code Error:", err);
          onError(err);
          return true;
        },
        qrCode: async (qr) => {
          onQrCode(qr);
        },
      }
    ).then((result) => {
      if (result) {
        const sessionString = (client.session as StringSession).save();
        onSuccess(sessionString);
      }
    }).catch(err => {
      console.error("SignIn QR Catch:", err);
      onError(err);
    });

  } catch (error) {
    console.error("Telegram Connection Error:", error);
    onError(error);
  }
};

