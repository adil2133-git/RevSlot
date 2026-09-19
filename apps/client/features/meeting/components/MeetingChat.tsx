"use client";

import type {
  RefObject,
} from "react";
import {
  Send,
  Users,
  X,
} from "lucide-react";

import type { MeetingMessage } from "../types/meeting.types";

type MeetingChatProps = {
  messages: MeetingMessage[];
  message: string;
  participantId: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
};

export default function MeetingChat({
  messages,
  message,
  participantId,
  messagesEndRef,
  onMessageChange,
  onSend,
  onClose,
}: MeetingChatProps) {
  return (
    <aside className="flex h-[360px] w-full flex-col rounded-2xl bg-white text-slate-900 lg:h-auto lg:w-80">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <Users size={17} />
          Meeting chat
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">
            Send a message or link to the group.
          </p>
        )}

        {messages.map((item) => {
          const isMine =
            item.participantId === participantId;

          return (
            <div
              key={item.id}
              className={
                isMine
                  ? "text-right"
                  : "text-left"
              }
            >
              <p className="mb-1 text-[11px] font-semibold text-slate-400">
                {item.name}
              </p>

              <div
                className={`inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                  isMine
                    ? "bg-primary text-on-primary"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {item.message}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(event) =>
              onMessageChange(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSend();
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Type a message…"
          />

          <button
            type="button"
            onClick={onSend}
            className="rounded-lg bg-primary px-3 text-on-primary"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
