"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Switch from "@/components/common/Switch";
import DayRow, { DayBlock } from "./DayRow";
import TimezoneSelect from "./TimezoneSelect";
import DateOverridesSection, { OverrideEntry } from "./DateOverridesSection";
import {
    createTemplateRequest,
    updateTemplateRequest,
    getTemplateByIdRequest,
    replaceTimeBlocksRequest,
} from "../api/availability.api";
import { guessTimezone } from "../utils/timezones";
import { normalizeTime } from "../utils/time";

const DAYS_ORDER = [
    { dayOfWeek: 1, label: "Mon" },
    { dayOfWeek: 2, label: "Tue" },
    { dayOfWeek: 3, label: "Wed" },
    { dayOfWeek: 4, label: "Thu" },
    { dayOfWeek: 5, label: "Fri" },
    { dayOfWeek: 6, label: "Sat" },
    { dayOfWeek: 0, label: "Sun" },
];

type DaysState = Record<number, { enabled: boolean; blocks: DayBlock[] }>;

function defaultDaysState(): DaysState {
    const state = {} as DaysState;
    DAYS_ORDER.forEach(({ dayOfWeek }) => {
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        state[dayOfWeek] = {
            enabled: isWeekday,
            blocks: isWeekday
                ? [{ localId: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" }]
                : [],
        };
    });
    return state;
}

interface ScheduleFormProps {
    mode: "create" | "edit";
    templateId?: number;
}

export default function ScheduleForm({ mode, templateId }: ScheduleFormProps) {
    const router = useRouter();

    const [name, setName] = useState("Working Hours");
    const [tz, setTz] = useState(guessTimezone());
    const [isDefault, setIsDefault] = useState(false);
    const [days, setDays] = useState<DaysState>(defaultDaysState());
    const [overrides, setOverrides] = useState<OverrideEntry[]>([]);

    const [loading, setLoading] = useState(mode === "edit");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (mode !== "edit" || !templateId) return;
        (async () => {
            try {
                const template = await getTemplateByIdRequest(templateId);
                setName(template.name);
                setTz(template.timezone);
                setIsDefault(template.isDefault);

                const grouped = defaultDaysState();
                DAYS_ORDER.forEach(({ dayOfWeek }) => {
                    grouped[dayOfWeek] = { enabled: false, blocks: [] };
                });
                template.timeBlocks
                    .slice()
                    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                    .forEach((block) => {
                        grouped[block.dayOfWeek].enabled = true;
                        grouped[block.dayOfWeek].blocks.push({
                            localId: crypto.randomUUID(),
                            startTime: normalizeTime(block.startTime),
                            endTime: normalizeTime(block.endTime),
                        });
                    });
                setDays(grouped);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load schedule");
            } finally {
                setLoading(false);
            }
        })();
    }, [mode, templateId]);

    function toggleDay(dayOfWeek: number) {
        setDays((prev) => {
            const current = prev[dayOfWeek];
            const enabling = !current.enabled;
            return {
                ...prev,
                [dayOfWeek]: {
                    enabled: enabling,
                    blocks: enabling && current.blocks.length === 0
                        ? [{ localId: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" }]
                        : current.blocks,
                },
            };
        });
    }

    function addBlock(dayOfWeek: number) {
        setDays((prev) => ({
            ...prev,
            [dayOfWeek]: {
                ...prev[dayOfWeek],
                blocks: [
                    ...prev[dayOfWeek].blocks,
                    { localId: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" },
                ],
            },
        }));
    }

    function removeBlock(dayOfWeek: number, localId: string) {
        setDays((prev) => ({
            ...prev,
            [dayOfWeek]: {
                ...prev[dayOfWeek],
                blocks: prev[dayOfWeek].blocks.filter((b) => b.localId !== localId),
            },
        }));
    }

    function changeBlock(dayOfWeek: number, localId: string, field: "startTime" | "endTime", value: string) {
        setDays((prev) => ({
            ...prev,
            [dayOfWeek]: {
                ...prev[dayOfWeek],
                blocks: prev[dayOfWeek].blocks.map((b) =>
                    b.localId === localId ? { ...b, [field]: value } : b
                ),
            },
        }));
    }

    async function handleSave() {
        setError(null);

        if (name.trim().length < 2) {
            setError("Name must be at least 2 characters.");
            return;
        }

        const blocksPayload = DAYS_ORDER.flatMap(({ dayOfWeek }) => {
            const day = days[dayOfWeek];
            if (!day.enabled) return [];
            return day.blocks.map((b, idx) => ({
                dayOfWeek,
                startTime: b.startTime,
                endTime: b.endTime,
                displayOrder: idx,
            }));
        });

        for (const block of blocksPayload) {
            if (block.endTime <= block.startTime) {
                setError("Each block's end time must be after its start time.");
                return;
            }
        }

        setSaving(true);
        try {
            let id = templateId;
            if (mode === "create") {
                const template = await createTemplateRequest({ name: name.trim(), timezone: tz, isDefault });
                id = template.id;
            } else if (id) {
                await updateTemplateRequest(id, { name: name.trim(), timezone: tz, isDefault });
            }
            if (id) {
                await replaceTimeBlocksRequest(id, blocksPayload);
            }
            router.push("/availability");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save schedule");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <p className="text-sm text-slate-400">Loading schedule…</p>;
    }

    return (
        <div className="pb-24">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
                    {mode === "create" ? "Add a new schedule" : "Edit schedule"}
                </h1>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => router.push("/availability")}
                        className="text-sm font-medium text-slate-500 hover:text-on-surface"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-surface disabled:opacity-60"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>

            {error && (
                <p className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-error">{error}</p>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-on-surface">Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">This is the name that will appear on your dashboard</p>
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-on-surface">Timezone</label>
                    <TimezoneSelect value={tz} onChange={setTz} />
                </div>
            </div>

            <h2 className="mb-3 mt-8 text-base font-semibold text-on-surface">Weekly hours</h2>
            <div className="rounded-xl border border-slate-100 bg-surface-card shadow-surface">
                {DAYS_ORDER.map(({ dayOfWeek, label }) => (
                    <DayRow
                        key={dayOfWeek}
                        label={label}
                        enabled={days[dayOfWeek].enabled}
                        blocks={days[dayOfWeek].blocks}
                        onToggle={() => toggleDay(dayOfWeek)}
                        onAddBlock={() => addBlock(dayOfWeek)}
                        onRemoveBlock={(localId) => removeBlock(dayOfWeek, localId)}
                        onBlockChange={(localId, field, value) => changeBlock(dayOfWeek, localId, field, value)}
                    />
                ))}
            </div>

            <DateOverridesSection
                overrides={overrides}
                onAdd={(entry: OverrideEntry) => setOverrides((prev) => [...prev, entry])}
                onRemove={(localId: string) => setOverrides((prev) => prev.filter((o) => o.localId !== localId))}
            />

            <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <Switch checked={isDefault} onChange={() => setIsDefault((v) => !v)} />
                <div>
                    <p className="text-sm font-medium text-on-surface">Set as default</p>
                    <p className="text-xs text-slate-400">This schedule will be used by default for new event types</p>
                </div>
            </div>

            <div className="fixed bottom-0 left-64 right-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-surface-card px-8 py-4 shadow-raised">
                <button
                    type="button"
                    onClick={() => router.push("/availability")}
                    className="text-sm font-medium text-slate-500 hover:text-on-surface"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-surface disabled:opacity-60"
                >
                    {saving ? "Saving…" : "Save schedule"}
                </button>
            </div>
        </div>
    );
}