"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

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

  const meeting = useMeeting({
    bookingId,
    token,
  });

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const user = useAuthStore(
    (state) => state.user
  );

  /*
   * Get advisor token.
   */
  const advisorToken =
    typeof window !== "undefined"
      ? getStoredAdvisorToken()
      : null;

  /*
   * Prevent duplicate automatic joins.
   */
  const autoJoinStartedRef =
    useRef(false);

  /*
   * Prevent automatic re-join after
   * the user clicks Leave.
   */
  const manuallyLeftRef =
    useRef(false);

  /*
   * Prevent JoinMeeting flash while deciding
   * whether this is Reviewer / Advisor.
   */
  const [autoJoinResolved, setAutoJoinResolved] =
    useState(false);

  const [chatOpen, setChatOpen] =
    useState(true);

  const [copied, setCopied] =
    useState(false);

  /*
   * --------------------------------------------------
   * Reset lifecycle when meeting changes
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
      participantId: meeting.participantIdRef.current,
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
      initialMessages: meeting.initialMessages,
      setError: meeting.setError,
    });

  /*
   * --------------------------------------------------
   * AUTOMATIC JOIN
   * --------------------------------------------------
   *
   * Reviewer -> automatic
   * Advisor  -> automatic
   * Guest    -> JoinMeeting screen
   */
  useEffect(() => {
    if (!meeting.info) {
      return;
    }

    /*
     * Already inside meeting.
     */
    if (meeting.joined) {
      setAutoJoinResolved(true);
      return;
    }

    /*
     * User explicitly left.
     *
     * NEVER auto-join again.
     */
    if (manuallyLeftRef.current) {
      setAutoJoinResolved(true);
      return;
    }

    /*
     * Automatic join already started.
     */
    if (autoJoinStartedRef.current) {
      return;
    }

    let participantName: string | null =
      null;

    let participantRole:
      | "reviewer"
      | "advisor"
      | null = null;

    /*
     * ------------------------------------------------
     * REVIEWER
     * ------------------------------------------------
     */
    if (
      user?.role === "reviewer" &&
      user.name
    ) {
      participantName = user.name;
      participantRole = "reviewer";
    }

    /*
     * ------------------------------------------------
     * ADVISOR
     * ------------------------------------------------
     */
    else if (
      advisorToken &&
      meeting.info.advisorName
    ) {
      participantName =
        meeting.info.advisorName;

      participantRole = "advisor";
    }

    /*
     * ------------------------------------------------
     * GUEST / INTERN
     * ------------------------------------------------
     *
     * No authenticated identity.
     * Show JoinMeeting.
     */
    if (
      !participantName ||
      !participantRole
    ) {
      setAutoJoinResolved(true);
      return;
    }

    /*
     * IMPORTANT:
     *
     * Mark this BEFORE starting async operation.
     */
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
         */
        const result =
          await meeting.join(
            participantName,
            participantRole
          );

        /*
         * Join failed.
         */
        if (!result) {
          webRTC.stopLocalMedia();

          autoJoinStartedRef.current =
            false;

          setAutoJoinResolved(true);

          return;
        }

        /*
         * Successfully joined.
         */
        setAutoJoinResolved(true);
      } catch (err: unknown) {
        webRTC.stopLocalMedia();

        /*
         * Don't show error if user already left.
         */
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
    advisorToken,
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

    /*
     * Manual join is intentional.
     */
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
   *
   * IMPORTANT:
   *
   * We don't render JoinMeeting after leaving.
   *
   * We completely navigate away from
   * /meeting/[bookingId].
   */
  const leave = async () => {
    /*
     * STOP AUTO JOIN FIRST.
     */
    manuallyLeftRef.current = true;

    /*
     * Stop WebRTC connections.
     */
    webRTC.cleanupPeers();

    /*
     * Stop camera + microphone.
     */
    webRTC.stopLocalMedia();

    /*
     * Tell backend that participant left.
     */
    await meeting.leave();

    /*
     * Completely exit meeting page.
     *
     * Reviewer -> dashboard bookings
     * Advisor  -> my bookings
     * Guest    -> browser back
     */
    if (user?.role === "reviewer") {
      router.replace(
        "/dashboard/bookings"
      );

      return;
    }

    if (advisorToken) {
      router.replace("/my-bookings");

      return;
    }

    /*
     * Guest / Intern
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

      window.setTimeout(
        () => {
          setCopied(false);
        },
        1500
      );
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
   * WAITING FOR AUTO JOIN
   * --------------------------------------------------
   *
   * This prevents JoinMeeting from flashing
   * for Reviewer / Advisor.
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
   * GUEST / INTERN JOIN SCREEN
   * --------------------------------------------------
   */
  if (!meeting.joined) {
    return (
      <JoinMeeting
        info={meeting.info}
        name={meeting.name}
        role={meeting.role}
        joining={meeting.joining}
        error={meeting.error}
        setName={meeting.setName}
        setRole={meeting.setRole}
        onJoin={() => void join()}
      />
    );
  }

  /*
   * --------------------------------------------------
   * ACTUAL WEBRTC ROOM
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