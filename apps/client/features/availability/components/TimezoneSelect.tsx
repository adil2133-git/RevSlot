"use client";

import { useEffect, useState } from "react";
import { useAvailabilityMetaStore } from "../store/meta.store";
import { ChevronDownIcon } from "./icons";

interface TimezoneSelectProps {
    value: string;
    onChange: (value: string) => void;
}

export default function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
    const { timezones: options, loadMeta } = useAvailabilityMetaStore();
    useEffect(() => { loadMeta(); }, [loadMeta]);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = query
        ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-on-surface"
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDownIcon />
            </button>

            {open && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-100 bg-white shadow-raised">
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search timezone…"
                        className="w-full border-b border-slate-100 px-3.5 py-2 text-sm outline-none"
                    />
                    <div className="max-h-64 overflow-y-auto">
                        {filtered.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                    setQuery("");
                                }}
                                className={`block w-full px-3.5 py-2 text-left text-sm hover:bg-surface-hover ${opt.value === value ? "bg-secondary font-medium text-primary" : "text-on-surface"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="px-3.5 py-2 text-sm text-slate-400">No matches</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}