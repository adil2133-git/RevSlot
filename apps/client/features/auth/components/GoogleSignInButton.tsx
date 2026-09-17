"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";

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
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const handleCredential = useCallback(
        async (response: { credential: string }) => {
            try {
                await googleAuth({ idToken: response.credential });
                router.replace("/dashboard");
            } catch {
                // error already captured in store
            }
        },
        [googleAuth, router]
    );

    const handleCredentialRef = useRef(handleCredential);
    useEffect(() => {
        handleCredentialRef.current = handleCredential;
    }, [handleCredential]);

    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (typeof window !== "undefined" && window.google) {
            setScriptLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!scriptLoaded || !window.google || !buttonRef.current) return;
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
            return;
        }

        if (!isInitializedRef.current) {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (res) => handleCredentialRef.current(res),
            });
            isInitializedRef.current = true;
        }

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            width: 360,
            shape: "pill",
            text: "continue_with",
        });
    }, [scriptLoaded]);

    return (
        <div className="w-full">
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => setScriptLoaded(true)}
            />
            <div ref={buttonRef} className="flex justify-center min-h-[40px]">
                {/* Visual placeholder that matches the actual Google button shape, size, and layout */}
                <div className="flex h-10 w-[360px] items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer">
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span>Continue with Google</span>
                </div>
            </div>
            {error && <p className="mt-2 text-center text-sm text-error">{error}</p>}
        </div>
    );
}

export default GoogleSignInButton;