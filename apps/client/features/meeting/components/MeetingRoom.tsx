"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getStoredAdvisorToken,
} from "@/features/advisor-bookings/services/advisorApi";

import {
  getGuestSession,
  useMeeting,
} from "../hooks/useMeeting";

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

  const meetingSource =
    searchParams.get("source");

  const meeting =
    useMeeting({
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

  const manuallyLeftRef =
    useRef(false);

  const mediaPreparationStartedRef =
    useRef(false);

  const [
    mediaReady,
    setMediaReady,
  ] = useState(false);

  const [
    preparingMedia,
    setPreparingMedia,
  ] = useState(false);

  const [chatOpen, setChatOpen] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

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
        meeting.participantIdRef.current ?? "",
      participants:
        meeting.participants,
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
   * PRE-JOIN IDENTITY
   * --------------------------------------------------
   *
   * Reviewer / Advisor:
   *   automatically use their existing name.
   *
   * Guest / Intern:
   *   restore previously entered name
   *   from this meeting's session.
   */
  useEffect(() => {
    if (!meeting.info) {
      return;
    }

    /*
     * Reviewer
     */
    if (
      meetingSource === "reviewer" &&
      user?.role === "reviewer" &&
      user.name
    ) {
      meeting.setName(user.name);
      return;
    }

    /*
     * Advisor
     */
    if (
      meetingSource === "advisor" &&
      advisorToken &&
      meeting.info.advisorName
    ) {
      meeting.setName(
        meeting.info.advisorName
      );
      return;
    }

    /*
     * Guest / Intern
     */
    if (!meetingSource) {
      const guestSession =
        getGuestSession(bookingId);

      if (guestSession) {
        meeting.setName(
          guestSession.name
        );

        meeting.setParticipantId(
          guestSession.participantId
        );
      }
    }
  }, [
    meeting.info,
    meeting.setName,
    meeting.setParticipantId,
    bookingId,
    meetingSource,
    user,
    advisorToken,
  ]);

  /*
   * --------------------------------------------------
   * PREPARE CAMERA + MICROPHONE
   * --------------------------------------------------
   *
   * IMPORTANT:
   *
   * We do NOT join WebRTC here.
   *
   * We only prepare the local media so the user
   * can see their camera and control mic/camera
   * before clicking "Join Meeting".
   */
  useEffect(() => {
    if (!meeting.info) {
      return;
    }

    if (meeting.joined) {
      return;
    }

    if (
      mediaPreparationStartedRef.current
    ) {
      return;
    }

    mediaPreparationStartedRef.current =
      true;

    setPreparingMedia(true);
    meeting.setError(null);

    const prepareMedia =
      async () => {
        try {
          await webRTC.getLocalMedia();

          setMediaReady(true);
        } catch (err: unknown) {
          setMediaReady(false);

          meeting.setError(
            err instanceof Error
              ? err.message
              : "Could not access your camera and microphone."
          );

          mediaPreparationStartedRef.current =
            false;
        } finally {
          setPreparingMedia(false);
        }
      };

    void prepareMedia();
  }, [
    meeting.info,
    meeting.joined,
    meeting.setError,
    webRTC.getLocalMedia,
  ]);

  useEffect(() => {
  if (meeting.joined) {
    setChatOpen(false);
  }
}, [meeting.joined]);

  /*
   * --------------------------------------------------
   * MANUAL JOIN
   * --------------------------------------------------
   *
   * Every participant now passes through
   * the Pre-Join screen.
   */
  const join = async () => {
    if (!meeting.name.trim()) {
      meeting.setError(
        "Enter your name before joining."
      );

      return;
    }

    if (!mediaReady) {
      meeting.setError(
        "Camera and microphone are not ready yet."
      );

      return;
    }

    meeting.setError(null);

    manuallyLeftRef.current = false;

    try {
      /*
       * Media was already prepared on the
       * Pre-Join screen.
       *
       * So we do NOT call getLocalMedia()
       * again here.
       */

      const result =
        await meeting.join();

      if (!result) {
        return;
      }
      setChatOpen(false);

    } catch (err: unknown) {
      webRTC.stopLocalMedia();

      meeting.setError(
        err instanceof Error
          ? err.message
          : "Could not join the meeting."
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
     * Reviewer entered from Reviewer dashboard.
     */
    if (
      meetingSource === "reviewer"
    ) {
      router.replace(
        "/dashboard/bookings"
      );

      return;
    }

    /*
     * Advisor entered from Advisor dashboard.
     */
    if (
      meetingSource === "advisor"
    ) {
      router.replace(
        "/my-bookings"
      );

      return;
    }

    /*
     * Guest / shared meeting link.
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
      const meetingLink =
        `${window.location.origin}/meeting/${bookingId}?token=${encodeURIComponent(token)}`;

      await navigator.clipboard.writeText(
        meetingLink
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
   * LOADING MEETING
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
   * PRE-JOIN SCREEN
   * --------------------------------------------------
   */
  if (!meeting.joined) {
    return (
      <JoinMeeting
        info={meeting.info}
        name={meeting.name}
        joining={meeting.joining}
        error={meeting.error}
        localVideoRef={
          webRTC.localVideoRef
        }
        muted={webRTC.muted}
        cameraOff={
          webRTC.cameraOff
        }
        mediaReady={mediaReady}
        preparingMedia={
          preparingMedia
        }
        showNameInput={
          !meetingSource
        }
        setName={
          meeting.setName
        }
        onToggleMic={
          webRTC.toggleMic
        }
        onToggleCamera={
          webRTC.toggleCamera
        }
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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex h-screen max-w-[1600px] flex-col p-3 lg:flex-row lg:gap-3">
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
              meeting.participantIdRef.current ??
              ""
            }
            remoteStreams={
              webRTC.remoteStreams
            }
            screenSharer={webRTC.screenSharer}
            remoteScreenStream={webRTC.remoteScreenStream}
            localScreenStream={webRTC.localScreenStream}
          />

          <MeetingControls
            muted={webRTC.muted}
            cameraOff={
              webRTC.cameraOff
            }
            sharing={
              webRTC.sharing
            }
            shareDisabled={
              webRTC.screenSharer !== null &&
              webRTC.screenSharer.participantId !==
                (meeting.participantIdRef.current ?? "")
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
              meeting.participantIdRef.current ??
              ""
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