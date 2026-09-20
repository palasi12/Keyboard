/**
 * Messaging between team members.
 *
 * Threads, messages and file attachments, all under row-level security: you
 * only see a thread you are a member of, and Postgres enforces that rather
 * than this file.
 *
 * Attachments live in the private `message-files` bucket under
 * `<thread_id>/<uuid>-<name>`. The first path segment is what the storage
 * policy checks membership against, so it must stay the thread id. Files are
 * read back through short-lived signed URLs — the bucket is not public.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface Thread {
  id: string;
  subject: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members: string[];
  last_read_at: string | null;
}

export interface Attachment {
  id: string;
  message_id: string;
  path: string;
  name: string;
  size: number;
  mime: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  attachments: Attachment[];
}

/** 25MB, matching the bucket's file_size_limit in the migration. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

function missingTable(code?: string): boolean {
  return code === '42P01';
}

export async function fetchThreads(): Promise<{ threads: Thread[]; error?: string }> {
  if (!supabase) return { threads: [], error: 'Not connected to Supabase.' };

  const { data, error } = await supabase
    .from('threads')
    .select('id, subject, created_by, created_at, updated_at, thread_members(user_id, last_read_at)')
    .order('updated_at', { ascending: false });

  if (error) {
    if (missingTable(error.code)) {
      return { threads: [], error: 'The messaging tables do not exist yet. Run the migration.' };
    }
    return { threads: [], error: 'Could not load messages.' };
  }

  const { data: session } = await supabase.auth.getSession();
  const me = session.session?.user.id;

  const threads = (data ?? []).map((row): Thread => {
    const members = (row.thread_members ?? []) as { user_id: string; last_read_at: string | null }[];
    return {
      id: row.id as string,
      subject: (row.subject as string) ?? '',
      created_by: (row.created_by as string | null) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      members: members.map((member) => member.user_id),
      last_read_at: members.find((member) => member.user_id === me)?.last_read_at ?? null,
    };
  });

  return { threads };
}

export async function fetchMessages(
  threadId: string,
): Promise<{ messages: Message[]; error?: string }> {
  if (!supabase) return { messages: [], error: 'Not connected to Supabase.' };

  const { data, error } = await supabase
    .from('messages')
    .select('id, thread_id, sender_id, body, created_at, attachments(id, message_id, path, name, size, mime)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    if (missingTable(error.code)) {
      return { messages: [], error: 'The messaging tables do not exist yet. Run the migration.' };
    }
    return { messages: [], error: 'Could not load that conversation.' };
  }

  const messages = (data ?? []).map((row): Message => ({
    id: row.id as string,
    thread_id: row.thread_id as string,
    sender_id: (row.sender_id as string | null) ?? null,
    body: (row.body as string) ?? '',
    created_at: row.created_at as string,
    attachments: ((row.attachments ?? []) as Attachment[]) ?? [],
  }));

  return { messages };
}

/**
 * Start a conversation with the given people. The creator is always a member,
 * otherwise they could not read the thread they just made.
 */
export async function createThread(
  subject: string,
  memberIds: string[],
): Promise<{ id?: string; error?: string }> {
  if (!supabase) return { error: 'Not connected to Supabase.' };

  const { data: session } = await supabase.auth.getSession();
  const me = session.session?.user.id;
  if (!me) return { error: 'Your session expired. Sign in again.' };

  const { data, error } = await supabase
    .from('threads')
    .insert({ subject: subject.trim(), created_by: me })
    .select('id')
    .single();

  if (error || !data) return { error: 'Could not start that conversation.' };

  const everyone = [...new Set([me, ...memberIds])];
  const { error: memberError } = await supabase
    .from('thread_members')
    .insert(everyone.map((userId) => ({ thread_id: data.id as string, user_id: userId })));

  if (memberError) return { error: 'Started the thread but could not add everyone to it.' };
  return { id: data.id as string };
}

/**
 * Post a message, with optional files.
 *
 * The message row is written first so the attachments have something to hang
 * off. If a file fails to upload the message still stands — losing the text
 * because an image was too big would be worse than a missing attachment.
 */
export async function sendMessage(
  threadId: string,
  body: string,
  files: File[] = [],
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Not connected to Supabase.' };

  const { data: session } = await supabase.auth.getSession();
  const me = session.session?.user.id;
  if (!me) return { ok: false, error: 'Your session expired. Sign in again.' };

  const text = body.trim();
  if (!text && files.length === 0) return { ok: false, error: 'Nothing to send.' };

  const tooBig = files.find((file) => file.size > MAX_FILE_BYTES);
  if (tooBig) {
    return { ok: false, error: `${tooBig.name} is over the 25MB limit.` };
  }

  const { data: inserted, error } = await supabase
    .from('messages')
    .insert({ thread_id: threadId, sender_id: me, body: text })
    .select('id')
    .single();

  if (error || !inserted) return { ok: false, error: 'Could not send that message.' };
  const messageId = inserted.id as string;

  const failed: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(-80);
    const path = `${threadId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('message-files')
      .upload(path, file, { contentType: file.type || 'application/octet-stream' });

    if (uploadError) {
      failed.push(file.name);
      continue;
    }

    const { error: rowError } = await supabase.from('attachments').insert({
      message_id: messageId,
      path,
      name: file.name.slice(0, 200),
      size: file.size,
      mime: file.type || 'application/octet-stream',
    });

    if (rowError) failed.push(file.name);
  }

  if (failed.length > 0) {
    return { ok: true, error: `Sent, but these did not upload: ${failed.join(', ')}.` };
  }
  return { ok: true };
}

/**
 * A temporary URL for a private attachment. The bucket is not public, so this
 * is the only way to read one, and the link stops working after an hour.
 */
export async function signedUrl(path: string): Promise<string | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase.storage
    .from('message-files')
    .createSignedUrl(path, 60 * 60);
  if (error) return undefined;
  return data?.signedUrl;
}

export async function markRead(threadId: string): Promise<void> {
  if (!supabase) return;
  const { data: session } = await supabase.auth.getSession();
  const me = session.session?.user.id;
  if (!me) return;

  await supabase
    .from('thread_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .eq('user_id', me);
}

/**
 * Live delivery. Without this the other founder only sees a message on
 * reload, which is the difference between a chat and a form.
 */
export function subscribeToMessages(
  threadId: string,
  onMessage: () => void,
): RealtimeChannel | undefined {
  if (!supabase) return undefined;

  return supabase
    .channel(`messages:${threadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
      () => onMessage(),
    )
    .subscribe();
}

export function unsubscribe(channel?: RealtimeChannel): void {
  if (channel && supabase) void supabase.removeChannel(channel);
}
