"use client";

import type {
  MutableRefObject,
  RefObject,
} from "react";

import type { MeetingParticipant } from "../types/meeting.types";
import LocalVideo from "./LocalVideo";
import RemoteVideo from "./RemoteVideo";

type MeetingGridProps = {
  localVideoRef: RefObject<HTMLVideoElement | null>;
  name: string;
  cameraOff: boolean;
  participants: MeetingParticipant[];
  participantId: string;
  remoteStreams: Map<string, MediaStream>;
};

export default function MeetingGrid({
  localVideoRef,
  name,
  cameraOff,
  participants,
  participantId,
  remoteStreams,
}: MeetingGridProps) {
  const remoteEntries = participants.filter(
    (participant) =>
      participant.id !== participantId
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
      <LocalVideo
        videoRef={localVideoRef}
        name={name}
        cameraOff={cameraOff}
      />

      {remoteEntries.map((participant) => (
        <RemoteVideo
          key={participant.id}
          participant={participant}
          stream={
            remoteStreams.get(participant.id) ??
            null
          }
        />
      ))}
    </div>
  );
}
