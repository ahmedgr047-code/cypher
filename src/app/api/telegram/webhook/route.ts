import { createAdminClient } from '@/lib/supabase/admin';
import { upsertSheetFromChannelPost } from '@/lib/telegram/ingest';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const token = request.headers.get('x-telegram-bot-api-secret-token');
    if (token !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const post = (body.channel_post || body.edited_channel_post) as
    | {
        message_id: number;
        chat: { id: number };
        document?: {
          file_id: string;
          file_unique_id: string;
          file_name?: string;
          mime_type?: string;
          file_size?: number;
        };
        caption?: string;
      }
    | undefined;

  if (!post?.document) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error('Supabase admin', e);
    return NextResponse.json({ ok: false, error: 'config' }, { status: 503 });
  }

  const channelId = BigInt(post.chat.id);
  const messageId = post.message_id;

  const result = await upsertSheetFromChannelPost(
    admin,
    channelId,
    messageId,
    {
      file_id: post.document.file_id,
      file_unique_id: post.document.file_unique_id,
      file_name: post.document.file_name,
      mime_type: post.document.mime_type,
      file_size: post.document.file_size,
    },
    post.caption
  );

  return NextResponse.json({ ok: result.ok, reason: result.reason });
}
