"use client";

import { useState, type RefObject } from "react";

import { MonitorUp } from "lucide-react";

import type {
  MeetingParticipant,
  ScreenShareState,
} from "../types/meeting.types";
import FeaturedVideo from "./FeaturedVideo";
import LocalVideo from "./LocalVideo";
import RemoteVideo from "./RemoteVideo";

type MeetingGridProps = {
  localVideoRef: RefObject<HTMLVideoElement | null>;
  name: string;
  cameraOff: boolean;
  participants: MeetingParticipant[];
  participantId: string;
  remoteStreams: Map<string, MediaStream>;
  screenSharer: ScreenShareState | null;
  remoteScreenStream: MediaStream | null;
  localScreenStream: MediaStream | null;
};

export default function MeetingGrid({
  localVideoRef,
  name,
  cameraOff,
  participants,
  participantId,
  remoteStreams,
  screenSharer,
  remoteScreenStream,
  localScreenStream,
}: MeetingGridProps) {
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const remoteEntries = participants.filter(
    (participant) => participant.id !== participantId
  );

  const screenActive = screenSharer !== null;

  const iAmPresenting = screenSharer?.participantId === participantId;

  const presenterName =
    participants.find(
      (participant) => participant.id === screenSharer?.participantId
    )?.name ?? "Participant";

  // A shared screen always wins the featured area.
  const pinnedParticipant =
    !screenActive && pinnedId
      ? (remoteEntries.find((participant) => participant.id === pinnedId) ??
        null)
      : null;

  const featured = screenActive || pinnedParticipant !== null;

  return (
     <div
  className={
    screenActive
      ? "flex min-h-0 flex-1 flex-row gap-3"
      : featured
        ? "flex min-h-0 flex-1 flex-col gap-3 lg:flex-row"
        : "flex min-h-0 flex-1 flex-col gap-3"
  }
>
      {screenActive ? (
        iAmPresenting ? (
          <FeaturedVideo
             kind="screen"
             stream={localScreenStream}
             label="You (presenting)"
          />
         ) : (
          <FeaturedVideo
            kind="screen"
            stream={remoteScreenStream}
            label={`${presenterName}'s screen`}
          />
        )
      ) : pinnedParticipant ? (
        <FeaturedVideo
          kind="camera"
          stream={remoteStreams.get(pinnedParticipant.id) ?? null}
          label={pinnedParticipant.name}
          onExit={() => setPinnedId(null)}
        />
      ) : null}

      <div
  className={
    screenActive
      ? "flex h-full min-h-0 w-[20%] shrink-0 flex-col gap-3 overflow-y-auto"
      : featured
        ? "flex h-28 shrink-0 gap-3 overflow-x-auto sm:h-36 lg:h-auto lg:min-h-0 lg:w-60 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto"
        : "grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3"
  }
>
        <LocalVideo
          videoRef={localVideoRef}
          name={name}
          cameraOff={cameraOff}
          compact={featured}
        />

        {remoteEntries.map((participant) => (
          <RemoteVideo
            key={participant.id}
            participant={participant}
            stream={remoteStreams.get(participant.id) ?? null}
            compact={featured}
            pinned={pinnedParticipant?.id === participant.id}
            muted={pinnedParticipant?.id === participant.id}
            onTogglePin={
              screenActive
                ? undefined
                : () =>
                    setPinnedId((current) =>
                      current === participant.id ? null : participant.id
                    )
            }
          />
        ))}
      </div>
    </div>
  );
}