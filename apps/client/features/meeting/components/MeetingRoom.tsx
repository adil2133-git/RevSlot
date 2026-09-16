"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getStoredAdvisorToken,
} from "@/features/advisor-bookings/services/advisorApi";

import { useMeeting } from "../hooks/useMeeting";
import { useMeetingChat } from "../hooks/useMeetingChat";
import { useMeetingWebRTC } from "../hooks/useMeetingWebRTC";

import JoinMeeting from "./JoinMeeting";
import MeetingChat from "./MeetingChat";
import MeetingControls from "./MeetingControls";
import MeetingGrid from "./MeetingGrid";
import MeetingHeader from "./MeetingHeader";

type Props = {
  bookingId: number;
  token: string;
};

export default function MeetingRoom({
  bookingId,
  token,
}: Props) {
  const router = useRouter();

  const searchParams = useSearchParams();
  const participantType =
  searchParams.get("participant");

  const meeting = useMeeting({
    bookingId,
    token,
  });

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const user = useAuthStore(
    (state) => state.user
  );

  const advisorToken =
    typeof window !== "undefined"
      ? getStoredAdvisorToken()
      : null;

  const autoJoinStartedRef =
    useRef(false);

  const manuallyLeftRef =
    useRef(false);

  const [autoJoinResolved, setAutoJoinResolved] =
    useState(false);

  const [chatOpen, setChatOpen] =
    useState(true);

  const [copied, setCopied] =
    useState(false);

  /*
   * --------------------------------------------------
   * RESET LIFECYCLE WHEN MEETING CHANGES
   * --------------------------------------------------
   */
  useEffect(() => {
    autoJoinStartedRef.current = false;
    manuallyLeftRef.current = false;
    setAutoJoinResolved(false);
  }, [bookingId, token]);

  /*
   * --------------------------------------------------
   * WEBRTC
   * --------------------------------------------------
   */
  const webRTC =
    useMeetingWebRTC({
      bookingId,
      token,
      joined: meeting.joined,
      participantId:
        meeting.participantIdRef.current,
      participants: meeting.participants,
      localStreamRef,
      socket: meeting.socket,
      setError: meeting.setError,
    });

  /*
   * --------------------------------------------------
   * CHAT
   * --------------------------------------------------
   */
  const chat =
    useMeetingChat({
      joined: meeting.joined,
      socket: meeting.socket,
      initialMessages:
        meeting.initialMessages,
      setError: meeting.setError,
    });

  /*
   * --------------------------------------------------
   * AUTOMATIC JOIN
   * --------------------------------------------------
   *
   * Reviewer -> automatic
   * Advisor  -> automatic
   * Intern   -> manual JoinMeeting
   * Guest    -> manual JoinMeeting
   *
   * Role is used only for business-level
   * auto-join decision.
   *
   * Role is NOT sent to WebRTC participant
   * identity or Socket.IO meeting:join payload.
   */
  useEffect(() => {
    if (!meeting.info) {
      return;
    }

    if (meeting.joined) {
      setAutoJoinResolved(true);
      return;
    }

    if (manuallyLeftRef.current) {
      setAutoJoinResolved(true);
      return;
    }

    if (autoJoinStartedRef.current) {
      return;
    }

    let participantName: string | null = null;

if (
  participantType === "advisor" &&
  meeting.info.advisorName
) {
  participantName = meeting.info.advisorName;
} else if (
  participantType === "reviewer" &&
  user?.name
) {
  participantName = user.name;
}

    /*
     * ------------------------------------------------
     * INTERN / GUEST
     * ------------------------------------------------
     *
     * No automatic identity.
     *
     * Show JoinMeeting so the participant
     * can enter their own name.
     */
    if (!participantName) {
      setAutoJoinResolved(true);
      return;
    }

    autoJoinStartedRef.current = true;

    const autoJoin = async () => {
      try {
        /*
         * Request camera + microphone.
         */
        await webRTC.getLocalMedia();

        /*
         * User may have clicked Leave while
         * getUserMedia was running.
         */
        if (manuallyLeftRef.current) {
          webRTC.stopLocalMedia();
          return;
        }

        /*
         * Join meeting.
         *
         * IMPORTANT:
         * No role is passed here.
         */
        const result =
          await meeting.join(
            participantName
          );

        if (!result) {
          webRTC.stopLocalMedia();

          autoJoinStartedRef.current =
            false;

          setAutoJoinResolved(true);

          return;
        }

        setAutoJoinResolved(true);
      } catch (err: unknown) {
        webRTC.stopLocalMedia();

        if (!manuallyLeftRef.current) {
          meeting.setError(
            err instanceof Error
              ? err.message
              : "Could not access your camera and microphone."
          );
        }

        autoJoinStartedRef.current =
          false;

        setAutoJoinResolved(true);
      }
    };

    void autoJoin();
  }, [
    meeting.info,
    meeting.joined,
    meeting.join,
    meeting.setError,
    webRTC.getLocalMedia,
    webRTC.stopLocalMedia,
    user,
    participantType,
  ]);

  /*
   * --------------------------------------------------
   * MANUAL JOIN
   * --------------------------------------------------
   */
  const join = async () => {
    if (!meeting.name.trim()) {
      meeting.setError(
        "Enter your name before joining."
      );

      return;
    }

    meeting.setError(null);

    manuallyLeftRef.current = false;

    try {
      await webRTC.getLocalMedia();

      const result =
        await meeting.join();

      if (!result) {
        webRTC.stopLocalMedia();
      }
    } catch (err: unknown) {
      webRTC.stopLocalMedia();

      meeting.setError(
        err instanceof Error
          ? err.message
          : "Could not access your camera and microphone."
      );
    }
  };

  /*
   * --------------------------------------------------
   * LEAVE MEETING
   * --------------------------------------------------
   */
  const leave = async () => {
    manuallyLeftRef.current = true;

    webRTC.cleanupPeers();

    webRTC.stopLocalMedia();

    await meeting.leave();

    /*
     * Reviewer
     */
    if (user?.role === "reviewer") {
      router.replace(
        "/dashboard/bookings"
      );

      return;
    }

    /*
     * Advisor
     */
    if (advisorToken) {
      router.replace("/my-bookings");

      return;
    }

    /*
     * Intern / Guest
     */
    router.back();
  };

  /*
   * --------------------------------------------------
   * COPY MEETING LINK
   * --------------------------------------------------
   */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      meeting.setError(
        "Unable to copy the meeting link."
      );
    }
  };

  /*
   * --------------------------------------------------
   * ERROR
   * --------------------------------------------------
   */
  if (
    meeting.error &&
    !meeting.info
  ) {
    return (
      <div className="mx-auto mt-20 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {meeting.error}
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */
  if (!meeting.info) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading meeting…
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * WAITING FOR AUTO JOIN DECISION
   * --------------------------------------------------
   */
  if (
    !meeting.joined &&
    !autoJoinResolved
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Joining meeting…
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * INTERN / GUEST JOIN SCREEN
   * --------------------------------------------------
   */
  if (!meeting.joined) {
    return (
      <JoinMeeting
        info={meeting.info}
        name={meeting.name}
        joining={meeting.joining}
        error={meeting.error}
        setName={meeting.setName}
        onJoin={() =>
          void join()
        }
      />
    );
  }

  /*
   * --------------------------------------------------
   * ACTUAL WEBRTC MEETING ROOM
   * --------------------------------------------------
   */
  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 text-white">
      <div className="mx-auto flex h-[calc(100vh-64px)] max-w-[1600px] flex-col p-3 lg:flex-row lg:gap-3">
        <section className="flex min-h-0 flex-1 flex-col rounded-2xl bg-slate-900 p-3">
          <MeetingHeader
            eventTypeName={
              meeting.info.eventTypeName
            }
            participantCount={
              meeting.participants.length
            }
            copied={copied}
            onCopy={() =>
              void copyLink()
            }
          />

          <MeetingGrid
            localVideoRef={
              webRTC.localVideoRef
            }
            name={meeting.name}
            cameraOff={
              webRTC.cameraOff
            }
            participants={
              meeting.participants
            }
            participantId={
              meeting.participantIdRef.current
            }
            remoteStreams={
              webRTC.remoteStreams
            }
          />

          <MeetingControls
            muted={webRTC.muted}
            cameraOff={
              webRTC.cameraOff
            }
            sharing={
              webRTC.sharing
            }
            chatOpen={chatOpen}
            onToggleMic={
              webRTC.toggleMic
            }
            onToggleCamera={
              webRTC.toggleCamera
            }
            onShareScreen={() =>
              void webRTC.shareScreen()
            }
            onToggleChat={() =>
              setChatOpen(
                (value) => !value
              )
            }
            onLeave={() =>
              void leave()
            }
          />
        </section>

        {chatOpen && (
          <MeetingChat
            messages={chat.messages}
            message={chat.message}
            participantId={
              meeting.participantIdRef.current
            }
            messagesEndRef={
              chat.messagesEndRef
            }
            onMessageChange={
              chat.setMessage
            }
            onSend={() =>
              void chat.sendChat()
            }
            onClose={() =>
              setChatOpen(false)
            }
          />
        )}
      </div>
    </main>
  );
}