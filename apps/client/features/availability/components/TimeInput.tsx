"use client";

import { useEffect, useRef, useState } from "react";
import { formatDisplayTime, parseManualTime, normalizeTime } from "../utils/time";
import { useAvailabilityMetaStore } from "../store/meta.store";
import { ClockIcon } from "./icons";


interface TimeInputProps {
    value: string; // "HH:MM" 24hr
    onChange: (value: string) => void;
}

export default function TimeInput({ value, onChange }: TimeInputProps) {
    const { timeOptions, loadMeta } = useAvailabilityMetaStore();
    useEffect(() => { loadMeta(); }, [loadMeta]);
    const [open, setOpen] = useState(false);
    const [text, setText] = useState(formatDisplayTime(value));
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => setText(formatDisplayTime(value)), [value]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
                commit(text);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);

    useEffect(() => {
        if (open) {
            const active = listRef.current?.querySelector('[data-active="true"]');
            active?.scrollIntoView({ block: "nearest" });
        }
    }, [open]);

    function commit(raw: string) {
        const parsed = parseManualTime(raw);
        if (parsed) {
            onChange(parsed);
        } else {
            setText(formatDisplayTime(value)); // revert to last valid value
        }
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus-within:border-primary">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            commit(text);
                            setOpen(false);
                            (e.target as HTMLInputElement).blur();
                        }
                        if (e.key === "Escape") {
                            setText(formatDisplayTime(value));
                            setOpen(false);
                        }
                    }}
                    className="w-[92px] bg-transparent text-sm text-on-surface outline-none"
                />
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="text-slate-400 hover:text-primary"
                    aria-label="Pick time"
                >
                    <ClockIcon />
                </button>
            </div>

            {open && (
                <div
                    ref={listRef}
                    className="absolute left-0 top-11 z-20 max-h-52 w-36 overflow-y-auto rounded-lg border border-slate-100 bg-white py-1 shadow-raised"
                >
                    {timeOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            data-active={opt.value === normalizeTime(value)}
                            onClick={() => {
                                onChange(opt.value);
                                setText(opt.label);
                                setOpen(false);
                            }}
                            className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-surface-hover ${opt.value === normalizeTime(value) ? "bg-secondary font-medium text-primary" : "text-on-surface"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}