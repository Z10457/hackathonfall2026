"use client";

import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { MODE_LABEL, formatTime } from "@/lib/constants";
import { cannedReply, messageTime, seedMessages } from "@/lib/groups";
import { makeId } from "@/lib/storage";
import type { ChatMessage, Group, Student } from "@/lib/types";
import { Sheet } from "./Sheet";

interface GroupChatProps {
  group: Group;
  student: Student;
  people: Student[];
  /** Stored thread for this group, if the student has ever posted. */
  stored: ChatMessage[] | undefined;
  onSave: (groupId: string, messages: ChatMessage[]) => void;
  onClose: () => void;
}

const REPLY_DELAY_MS = 1500;

export function GroupChat({ group, student, people, stored, onSave, onClose }: GroupChatProps) {
  const seeded = useMemo(() => seedMessages(group, people), [group, people]);
  const messages = stored ?? seeded;
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLLIElement>(null);
  const latest = useRef(messages);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    latest.current = messages;
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, typing]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const send = (event: FormEvent): void => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const mine: ChatMessage = {
      id: makeId("msg"),
      groupId: group.id,
      authorId: student.id,
      authorName: student.name,
      text,
      sentAt: new Date().toISOString(),
    };
    const next = [...latest.current, mine];
    latest.current = next;
    onSave(group.id, next);
    setDraft("");
    setTyping(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const reply = cannedReply(group, people, latest.current.length);
      const withReply = [...latest.current, reply];
      latest.current = withReply;
      onSave(group.id, withReply);
      setTyping(false);
      timer.current = null;
    }, REPLY_DELAY_MS);
  };

  return (
    <Sheet
      tall
      title={group.name}
      subtitle={`${MODE_LABEL[group.mode]} from ${group.origin}, ${formatTime(group.departureTime)}`}
      onClose={onClose}
      footer={
        <form onSubmit={send} className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <input id="chat-input" className="input" value={draft} maxLength={400} autoComplete="off" placeholder="Message your group" onChange={(e) => setDraft(e.target.value)} />
          <button type="submit" className="btn-primary !w-11 shrink-0 !p-0" aria-label="Send message" disabled={!draft.trim()}>
            <Send className="h-4 w-4" />
          </button>
        </form>
      }
    >
      <ul className="flex flex-col gap-3 bg-paper/60 px-4 py-4" aria-live="polite" aria-label="Messages">
        {messages.map((m) => {
          const mine = m.authorId === student.id;
          return (
            <li key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className="mb-0.5 px-1 text-[11px] font-semibold text-ink-500">
                {mine ? "You" : m.authorName} <span className="font-normal text-ink-400">{messageTime(m.sentAt)}</span>
              </span>
              <p className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${mine ? "rounded-br-md bg-maroon-700 text-white" : "rounded-bl-md border border-line bg-white text-ink-900"}`}>
                {m.text}
              </p>
            </li>
          );
        })}
        {typing ? <li className="px-1 text-xs text-ink-500">Someone is typing...</li> : null}
        <li ref={endRef} aria-hidden />
      </ul>
    </Sheet>
  );
}
