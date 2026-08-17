"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
    googleWhatsappSchema,
    type GoogleWhatsappFormValues,
} from "@/features/auth/validation/authSchema";
import { ApiError } from "@/lib/axios";

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                    }) => void;
                    renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
                };
            };
        };
    }
}

function GoogleSignInButton() {
    const router = useRouter();
    const { googleAuth, error } = useAuthStore();
    const buttonRef = useRef<HTMLDivElement>(null);
    const pendingIdToken = useRef<string | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [needsWhatsapp, setNeedsWhatsapp] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<GoogleWhatsappFormValues>({
        resolver: zodResolver(googleWhatsappSchema),
    });

    const handleCredential = useCallback(
        async (response: { credential: string }) => {
            pendingIdToken.current = response.credential;
            try {
                await googleAuth({ idToken: response.credential });
                router.push("/dashboard");
            } catch (err) {
                // New Google user, no linked account yet — backend needs a
                // WhatsApp number before it'll create one.
                if (err instanceof ApiError && err.status === 422) {
                    setNeedsWhatsapp(true);
                }
            }
        },
        [googleAuth, router]
    );

    useEffect(() => {
        if (!scriptLoaded || !window.google || !buttonRef.current) return;
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
            return;
        }
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredential,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            width: 360,
            shape: "pill",
            text: "continue_with",
        });
    }, [scriptLoaded, handleCredential]);

    const submitWhatsapp = async (values: GoogleWhatsappFormValues) => {
        if (!pendingIdToken.current) return;
        try {
            await googleAuth({
                idToken: pendingIdToken.current,
                whatsappNumber: values.whatsappNumber,
            });
            router.push("/dashboard");
        } catch {
            // error already captured in store; surfaced below
        }
    };

    if (needsWhatsapp) {
        return (
            <form
                onSubmit={handleSubmit(submitWhatsapp)}
                className="space-y-3 rounded-lg border border-slate-300 p-4"
            >
                <p className="text-sm font-medium text-on-surface">
                    One more thing — your WhatsApp number
                </p>
                <p className="text-xs text-slate-600">
                    Advisors use this as a fallback if you don&apos;t show up on Meet.
                </p>
                <input
                    placeholder="+91 98765 43210"
                    maxLength={15}
                    {...register("whatsappNumber")}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-secondary"
                />
                {errors.whatsappNumber && (
                    <p className="text-sm text-error">{errors.whatsappNumber.message}</p>
                )}
                {error && <p className="text-sm text-error">{error}</p>}
                <button
                    type="submit"
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-on-primary shadow-surface transition-shadow hover:shadow-raised"
                >
                    Continue
                </button>
            </form>
        );
    }

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => setScriptLoaded(true)}
            />
            <div ref={buttonRef} className="flex justify-center" />
        </>
    );
}

export default GoogleSignInButton;