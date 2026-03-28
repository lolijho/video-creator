import { prisma } from "./prisma";
import { decrypt } from "./crypto";

export async function getApiKey(): Promise<string | null> {
  if (process.env.APIFREE_API_KEY) return process.env.APIFREE_API_KEY;

  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "main" },
    });
    if (settings?.apifreeKeyEnc) {
      return decrypt(settings.apifreeKeyEnc);
    }
  } catch {
    // Settings not initialized yet
  }

  return null;
}
