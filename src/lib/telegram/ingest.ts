import type { SupabaseClient } from '@supabase/supabase-js';

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

function getEnvChannelId(): bigint | null {
  const raw = process.env.TELEGRAM_CHANNEL_ID?.trim();
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export async function upsertSheetFromChannelPost(
  admin: SupabaseClient,
  channelId: bigint,
  messageId: number,
  document: TelegramDocument,
  caption: string | undefined
): Promise<{ ok: boolean; reason?: string }> {
  const allowed = getEnvChannelId();
  if (allowed !== null && channelId !== allowed) {
    return { ok: false, reason: 'channel_filtered' };
  }

  const { error } = await admin.from('telegram_sheets').upsert(
    {
      telegram_file_id: document.file_id,
      telegram_file_unique_id: document.file_unique_id,
      file_name: document.file_name ?? null,
      caption: caption ?? null,
      mime_type: document.mime_type ?? null,
      file_size: document.file_size ?? null,
      channel_id: channelId,
      message_id: messageId,
    },
    { onConflict: 'channel_id,message_id' }
  );

  if (error) {
    console.error('telegram_sheets upsert', error);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}
