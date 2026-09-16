export type MeetingRole =
  | "reviewer"
  | "advisor"
  | "intern"
  | "guest";

export type MeetingParticipant = {
  id: string;
  name: string;
  role: MeetingRole;
  lastSeen: number;
};

export type MeetingMessage = {
  id: number;
  participantId: string;
  name: string;
  role: MeetingRole;
  message: string;
  createdAt: number;
};

export type MeetingSignal = {
  id: number;
  from: string;
  to: string;
  type: "offer" | "answer" | "ice-candidate";
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  createdAt: number;
};

export type MeetingInfo = {
  bookingId: number;
  eventTypeName: string;
  reviewerName: string;
  advisorName: string;
  internName: string;
  startTime: string;
  endTime: string;
};

export type JoinMeetingResponse = {
  booking: unknown;
  participants: MeetingParticipant[];
  messages: MeetingMessage[];
  maxParticipants: number;
};

export type PeerState = {
  connection: RTCPeerConnection;
  stream: MediaStream;
};

export type MeetingProps = {
  bookingId: number;
  token: string;
};
