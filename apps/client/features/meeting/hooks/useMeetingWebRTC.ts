"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import type {
  MeetingParticipant,
  MeetingSignal,
  PeerState,
  ScreenShareState,
} from "../types/meeting.types";
import type { MeetingSocket } from "../socket/meetingSocket";

const buildIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrls = (process.env.NEXT_PUBLIC_TURN_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const username = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const credential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrls.length > 0 && username && credential) {
    servers.push({ urls: turnUrls, username, credential });
  }

  return servers;
};
const ICE_SERVERS: RTCIceServer[] = buildIceServers();

type UseMeetingWebRTCProps = {
  bookingId: number;
  token: string;
  joined: boolean;
  participantId: string;
  participants: MeetingParticipant[];
  localStreamRef: MutableRefObject<MediaStream | null>;
  socket: MeetingSocket | null;
  setError: (message: string | null) => void;
};

export function useMeetingWebRTC({
  bookingId: _bookingId,
  token: _token,
  joined,
  participantId,
  participants,
  localStreamRef,
  socket,
  setError,
}: UseMeetingWebRTCProps) {
  const localVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const screenStreamRef =
    useRef<MediaStream | null>(null);

  /*
   * Screen share is sent as a SECOND, separate set of tracks
   * (own MediaStream) next to the camera. senders are kept per
   * remote peer so they can be removed when sharing stops.
   */
  const screenSendersRef =
    useRef<Map<string, RTCRtpSender[]>>(
      new Map()
    );

  /*
   * Latest screen-share state announced by the server.
   * A ref so `ontrack` (created once per peer) always
   * reads the current value.
   */
  const screenInfoRef =
    useRef<ScreenShareState | null>(null);

  /*
   * First stream received from a peer = its camera stream.
   * Any other stream from the same peer is its screen.
   */
  const cameraStreamIdRef =
    useRef<Map<string, string>>(
      new Map()
    );

  /*
   * Non-camera streams received from peers (screen shares).
   */
  const extraStreamsRef =
    useRef<
      Map<
        string,
        {
          remoteId: string;
          stream: MediaStream;
        }
      >
    >(new Map());

  const peersRef =
    useRef<Map<string, PeerState>>(
      new Map()
    );

  const pendingIceRef =
    useRef<Map<string, RTCIceCandidateInit[]>>(
      new Map()
    );
  
  const disconnectTimersRef =
    useRef<Map<string, ReturnType<typeof setTimeout>>>(
      new Map()
    );


  const readyPeersRef =
    useRef<Set<string>>(new Set());

  const [
    remoteStreams,
    setRemoteStreams,
  ] = useState<Map<string, MediaStream>>(
    new Map()
  );

  const [
    screenSharer,
    setScreenSharer,
  ] = useState<ScreenShareState | null>(
    null
  );

  const [
    remoteScreenStream,
    setRemoteScreenStream,
  ] = useState<MediaStream | null>(null);

  const [
  localScreenStream,
  setLocalScreenStream,
] = useState<MediaStream | null>(null);

  const [muted, setMuted] =
    useState(false);

  const [cameraOff, setCameraOff] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  const [screenShareNeedsResume, setScreenShareNeedsResume] =
  useState(false);

  /*
   * --------------------------------------------------
   * LOCAL VIDEO
   * --------------------------------------------------
   */
  const setLocalVideo = useCallback(
    (stream: MediaStream | null) => {
      const video =
        localVideoRef.current;

      if (!video) {
        return;
      }

      video.srcObject = stream;
      video.muted = true;

      if (stream) {
        void video
          .play()
          .catch(() => undefined);
      }
    },
    []
  );

  /*
   * --------------------------------------------------
   * GET CAMERA + MICROPHONE
   * --------------------------------------------------
   */
     const getLocalMedia =
    useCallback(async () => {
      if (
        !navigator.mediaDevices
          ?.getUserMedia
      ) {
        throw new Error(
          "Camera and microphone are not supported by this browser."
        );
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: true,
            }
          );

        localStreamRef.current =
          stream;

        setLocalVideo(stream);

        return stream;
      } catch {
        /* fall through to audio-only */
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: false,
              audio: true,
            }
          );

        localStreamRef.current =
          stream;

        setLocalVideo(stream);

        setCameraOff(true);

        setError(
          "Camera is unavailable — you're joining with audio only."
        );

        return stream;
      } catch {
        /* fall through to view-only */
      }

      const emptyStream =
        new MediaStream();

      localStreamRef.current =
        emptyStream;

      setLocalVideo(null);

      setMuted(true);
      setCameraOff(true);

      setError(
        "Camera and microphone are unavailable — you've joined in view-only mode."
      );

      return emptyStream;
    }, [
      localStreamRef,
      setLocalVideo,
      setError,
      setMuted,
      setCameraOff,
    ]);

  /*
   * --------------------------------------------------
   * STOP LOCAL MEDIA
   * --------------------------------------------------
   */
  const stopLocalMedia =
    useCallback(() => {
      screenStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      localStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      screenStreamRef.current =
        null;

      localStreamRef.current =
        null;

      setLocalVideo(null);

      setMuted(false);
      setCameraOff(false);
      setSharing(false);
    }, [
      localStreamRef,
      setLocalVideo,
    ]);

  /*
   * --------------------------------------------------
   * SEND WEBRTC SIGNAL
   * --------------------------------------------------
   *
   * Socket.IO carries signaling only.
   * Actual media never goes through Socket.IO.
   * --------------------------------------------------
   */
  const sendSignal = useCallback(
    async (
      to: string,
      type: MeetingSignal["type"],
      payload: unknown
    ) => {
      if (!socket?.connected) {
        throw new Error(
          "Meeting connection is not available."
        );
      }

      await new Promise<void>(
        (resolve, reject) => {
          socket.emit(
            "webrtc:signal",
            {
              to,
              type,
              payload,
            },
            (response) => {
              if (response.ok) {
                resolve();
                return;
              }

              reject(
                new Error(
                  response.error ??
                    "Unable to send WebRTC signal."
                )
              );
            }
          );
        }
      );
    },
    [socket]
  );

  /*
   * --------------------------------------------------
   * REMOTE SCREEN STREAM (derived)
   * --------------------------------------------------
   *
   * Picks the stream that the server says is the
   * presenter's screen. If the receiver's browser assigned
   * a different streamId than the sender's, fall back to
   * finding the stream by presenter participantId.
   */
  const syncRemoteScreenStream =
    useCallback(() => {
      const info =
        screenInfoRef.current;

      if (!info) {
        setRemoteScreenStream(null);
        return;
      }

      // 1. Direct match by streamId
      let entry = extraStreamsRef.current.get(info.streamId);

      // 2. Fallback: search by presenter participantId
      if (!entry || entry.remoteId !== info.participantId) {
        for (const streamEntry of extraStreamsRef.current.values()) {
          if (streamEntry.remoteId === info.participantId) {
            entry = streamEntry;
            break;
          }
        }
      }

      const next =
        entry &&
        entry.remoteId === info.participantId
          ? entry.stream
          : null;

      setRemoteScreenStream(
        (current) =>
          current === next
            ? current
            : next
      );
    }, []);

  /*
   * --------------------------------------------------
   * RENEGOTIATE (used when screen tracks are added
   * or removed on an already-connected peer)
   * --------------------------------------------------
   */
  const renegotiate =
    useCallback(
      async (remoteId: string) => {
        const connection =
          peersRef.current.get(
            remoteId
          )?.connection;

        if (!connection) {
          return;
        }

        /*
         * Wait for any in-flight negotiation to finish.
         */
        for (
          let attempt = 0;
          attempt < 20 &&
          connection.signalingState !==
            "stable";
          attempt += 1
        ) {
          await new Promise(
            (resolve) =>
              setTimeout(resolve, 150)
          );
        }

        if (
          connection.signalingState !==
          "stable"
        ) {
          return;
        }

        const offer =
          await connection.createOffer();

        await connection.setLocalDescription(
          offer
        );

        await sendSignal(
          remoteId,
          "offer",
          offer
        );
      },
      [sendSignal]
    );

  /*
   * Add the local screen tracks to one peer and
   * renegotiate so that peer starts receiving them.
   */
  const attachScreenTo =
    useCallback(
      async (remoteId: string) => {
        const peer =
          peersRef.current.get(
            remoteId
          );

        const screenStream =
          screenStreamRef.current;

        if (
          !peer ||
          !screenStream ||
          screenSendersRef.current.has(
            remoteId
          )
        ) {
          return;
        }

        const senders =
          screenStream
            .getTracks()
            .map((track) =>
              peer.connection.addTrack(
                track,
                screenStream
              )
            );

        screenSendersRef.current.set(
          remoteId,
          senders
        );

        await renegotiate(remoteId);
      },
      [renegotiate]
    );

  /*
   * --------------------------------------------------
   * REMOVE PEER
   * --------------------------------------------------
   */

  const removePeer = useCallback(
    (remoteId: string, connection?: RTCPeerConnection) => {

      const peer =
        peersRef.current.get(
          remoteId
        );

      if (
        connection &&
        peer &&
        peer.connection !== connection
      ) {
      
        return;
      }

      readyPeersRef.current.delete(
        remoteId
      );

      const pendingTimer =
        disconnectTimersRef.current.get(
          remoteId
        );

      if (pendingTimer) {
        clearTimeout(pendingTimer);
        disconnectTimersRef.current.delete(
          remoteId
        );
      }

      peer?.connection.close();

      peersRef.current.delete(
        remoteId
      );

      pendingIceRef.current.delete(
        remoteId
      );

      screenSendersRef.current.delete(
        remoteId
      );

      cameraStreamIdRef.current.delete(
        remoteId
      );

      for (const [
        streamId,
        entry,
      ] of extraStreamsRef.current) {
        if (entry.remoteId === remoteId) {
          extraStreamsRef.current.delete(
            streamId
          );
        }
      }

      syncRemoteScreenStream();

      setRemoteStreams(
        (current) => {
          const next =
            new Map(current);

          next.delete(remoteId);

          return next;
        }
      );
    },
    [syncRemoteScreenStream]
  );

  /*
   * --------------------------------------------------
   * CREATE PEER CONNECTION
   * --------------------------------------------------
   */
  const createPeer = useCallback(
    (remoteId: string) => {
      const existing =
  peersRef.current.get(
    remoteId
  );

if (existing) {
  const existingState =
    existing.connection
      .connectionState;

  if (
    existingState !== "closed" &&
    existingState !== "failed"
  ) {
    return existing.connection;
  }

  removePeer(remoteId);
}

      const connection =
        new RTCPeerConnection({
          iceServers:
            ICE_SERVERS,
        });

      const remoteStream =
        new MediaStream();

      peersRef.current.set(
        remoteId,
        {
          connection,
          stream:
            remoteStream,
        }
      );

      /*
       * Add local camera + microphone
       */
      const localStream =
        localStreamRef.current;

      localStream
        ?.getTracks()
        .forEach((track) => {
          connection.addTrack(
            track,
            localStream
          );
        });

      /*
       * Receive remote tracks
       */
      connection.ontrack = (
        event
      ) => {
        const incoming =
          event.streams[0];

        if (incoming) {
          const info =
            screenInfoRef.current;

          const knownCameraId =
            cameraStreamIdRef.current.get(
              remoteId
            );

          const isScreenStream =
            !!info &&
            info.participantId ===
              remoteId &&
            info.streamId ===
              incoming.id;

          /*
           * Screen share: keep it OUT of the camera
           * stream so the participant tile is unchanged.
           */
          if (
            isScreenStream ||
            (knownCameraId &&
              knownCameraId !==
                incoming.id)
          ) {
            extraStreamsRef.current.set(
              incoming.id,
              {
                remoteId,
                stream: incoming,
              }
            );

            syncRemoteScreenStream();

            return;
          }

          cameraStreamIdRef.current.set(
            remoteId,
            incoming.id
          );
        }

        const tracks =
          event.streams[0]
            ?.getTracks() ??
          [event.track];

        for (const track of tracks) {
          const alreadyAdded =
            remoteStream
              .getTracks()
              .some(
                (item) =>
                  item.id === track.id
              );

          if (!alreadyAdded) {
            remoteStream.addTrack(
              track
            );
          }
        }

        setRemoteStreams(
          (current) => {
            const next =
              new Map(current);

            next.set(
              remoteId,
              remoteStream
            );

            return next;
          }
        );
      };

      /*
       * Send ICE candidates
       */
      connection.onicecandidate = (
        event
      ) => {
        if (!event.candidate) {
          return;
        }

        void sendSignal(
          remoteId,
          "ice-candidate",
          event.candidate.toJSON()
        ).catch(() => undefined);
      };

      connection.onconnectionstatechange =
        () => {
          const state =
            connection.connectionState;

          if (
            state === "failed"
          ) {
            try {
              if (typeof connection.restartIce === "function") {
                connection.restartIce();
                if (participantId && participantId < remoteId) {
                  void renegotiate(remoteId).catch(() => undefined);
                }
                return;
              }
            } catch {
              // Fallback to removePeer
            }
            removePeer(
              remoteId,
              connection
            );
            return;
          }

          if (state === "closed") {
            removePeer(
              remoteId,
              connection
            );
            return;
          }

          if (state === "disconnected") {
            const existingTimer =
              disconnectTimersRef.current.get(
                remoteId
              );

            if (existingTimer) {
              clearTimeout(existingTimer);
            }

            const timer = setTimeout(() => {
              disconnectTimersRef.current.delete(
                remoteId
              );

              if (
                connection.connectionState ===
                "disconnected"
              ) {
                removePeer(remoteId, connection);
              }
            }, 8000);

            disconnectTimersRef.current.set(
              remoteId,
              timer
            );

            return;
          }

          /*
           * Someone is presenting and this peer just
           * (re)connected -> start sending them the screen.
           */
          if (
            state === "connected" &&
            screenStreamRef.current
          ) {
            void attachScreenTo(
              remoteId
            ).catch(() => undefined);
          }

          const recoveredTimer =
            disconnectTimersRef.current.get(
              remoteId
            );

          if (recoveredTimer) {
            clearTimeout(recoveredTimer);
            disconnectTimersRef.current.delete(
              remoteId
            );
          }
        };

      return connection;
    },
    [
      localStreamRef,
      removePeer,
      sendSignal,
      syncRemoteScreenStream,
      attachScreenTo,
    ]
  );

  /*
   * --------------------------------------------------
   * FLUSH PENDING ICE
   * --------------------------------------------------
   */
  const flushIce = useCallback(
    async (
      remoteId: string,
      connection: RTCPeerConnection
    ) => {
      const pending =
        pendingIceRef.current.get(
          remoteId
        ) ?? [];

      pendingIceRef.current.delete(
        remoteId
      );

      for (const candidate of pending) {
        try {
          await connection.addIceCandidate(
            candidate
          );
        } catch {
          /*
           * Ignore stale candidates.
           */
        }
      }
    },
    []
  );

  /*
   * --------------------------------------------------
   * HANDLE SIGNAL
   * --------------------------------------------------
   */
  const handleSignal = useCallback(
    async (
      signal: MeetingSignal
    ) => {
      if (
        signal.to !==
        participantId
      ) {
        return;
      }

      const connection =
        createPeer(signal.from);

      /*
       * OFFER
       */
      if (
        signal.type ===
        "offer"
      ) {
        await connection.setRemoteDescription(
          signal.payload as RTCSessionDescriptionInit
        );

        await flushIce(
          signal.from,
          connection
        );

        const answer =
          await connection.createAnswer();

        await connection.setLocalDescription(
          answer
        );

        await sendSignal(
          signal.from,
          "answer",
          answer
        );

        return;
      }

      /*
       * ANSWER
       */
      if (
        signal.type ===
        "answer"
      ) {
        await connection.setRemoteDescription(
          signal.payload as RTCSessionDescriptionInit
        );

        await flushIce(
          signal.from,
          connection
        );

        return;
      }

      /*
       * ICE CANDIDATE
       */
      const candidate =
        signal.payload as RTCIceCandidateInit;

      try {
        if (
          connection.remoteDescription
        ) {
          await connection.addIceCandidate(
            candidate
          );
        } else {
          const queue =
            pendingIceRef.current.get(
              signal.from
            ) ?? [];

          queue.push(candidate);

          pendingIceRef.current.set(
            signal.from,
            queue
          );
        }
      } catch {
        /*
         * Ignore invalid candidates.
         */
      }
    },
    [
      createPeer,
      flushIce,
      participantId,
      sendSignal,
    ]
  );

  /*
   * --------------------------------------------------
   * CREATE OFFER
   * --------------------------------------------------
   *
   * Deterministic rule:
   * lower participantId creates offer.
   *
   * This prevents both peers from creating
   * simultaneous offers.
   * --------------------------------------------------
   */
  const createOfferFor =
    useCallback(
      async (
        remoteId: string
      ) => {
        if (
          !participantId ||
          participantId >=
            remoteId
        ) {
          return;
        }

        const connection =
          createPeer(remoteId);

        if (
          connection.signalingState !==
          "stable"
        ) {
          return;
        }

        const offer =
          await connection.createOffer();

        await connection.setLocalDescription(
          offer
        );

        await sendSignal(
          remoteId,
          "offer",
          offer
        );
      },
      [
        createPeer,
        participantId,
        sendSignal,
      ]
    );

  /*
   * --------------------------------------------------
   * SCREEN SHARE STATE (from server)
   * --------------------------------------------------
   *
   * Declared BEFORE the signal listener effect so the
   * listener exists before `webrtc:ready` is emitted
   * (the server answers that with the current state).
   */
  useEffect(() => {
    if (
      !joined ||
      !socket
    ) {
      return;
    }

    const onScreenState = (
      next: ScreenShareState | null
    ) => {
      const previous =
        screenInfoRef.current;

      if (
        previous &&
        previous.streamId !==
          next?.streamId
      ) {
        extraStreamsRef.current.delete(
          previous.streamId
        );
      }

      screenInfoRef.current =
        next;

      setScreenSharer(next);

      syncRemoteScreenStream();
    };

    socket.on(
      "screen:state",
      onScreenState
    );

    return () => {
      socket.off(
        "screen:state",
        onScreenState
      );
    };
  }, [
    joined,
    socket,
    syncRemoteScreenStream,
  ]);

  /*
   * --------------------------------------------------
   * WEBRTC SIGNAL LISTENER
   * --------------------------------------------------
   */
  useEffect(() => {
    if (
      !joined ||
      !socket
    ) {
      return;
    }

    const onSignal = (
      signal: MeetingSignal
    ) => {
      void handleSignal(
        signal
      ).catch(() => {
        setError(
          "A WebRTC connection could not be established."
        );
      });
    };

    socket.on(
      "webrtc:signal",
      onSignal
    );

    socket.emit("webrtc:ready");

    for (const participant of participants) {
      if (participant.id !== participantId) {
        readyPeersRef.current.add(
          participant.id
        );
      }
    }

    return () => {
      socket.off(
        "webrtc:signal",
        onSignal
      );
    };
  }, [
    joined,
    socket,
    handleSignal,
    setError,
    participants,
    participantId,
  ]);

  /*
   * --------------------------------------------------
   * REMOTE PEER ANNOUNCED READY
   * --------------------------------------------------
   */
  useEffect(() => {
    if (
      !joined ||
      !socket
    ) {
      return;
    }

    const onParticipantReady = ({
      participantId: remoteId,
    }: {
      participantId: string;
    }) => {
      readyPeersRef.current.add(
        remoteId
      );

      if (
        !peersRef.current.has(
          remoteId
        )
      ) {
        void createOfferFor(
          remoteId
        ).catch(() => undefined);
      }
    };

    socket.on(
      "participant:ready",
      onParticipantReady
    );

    return () => {
      socket.off(
        "participant:ready",
        onParticipantReady
      );
    };
  }, [
    joined,
    socket,
    createOfferFor,
  ]);

  /*
   * --------------------------------------------------
   * CREATE PEERS FOR PARTICIPANTS
   * --------------------------------------------------
   */
  useEffect(() => {
    if (
      !joined ||
      !participantId
    ) {
      return;
    }

    for (const participant of participants) {
      if (
        participant.id ===
        participantId
      ) {
        continue;
      }

      // Confirmed room members are ready to negotiate
      readyPeersRef.current.add(participant.id);

      if (
        !peersRef.current.has(
          participant.id
        )
      ) {
        void createOfferFor(
          participant.id
        ).catch(() => undefined);
      }
    }

    const activeIds =
      new Set(
        participants
          .filter(
            (participant) =>
              participant.id !==
              participantId
          )
          .map(
            (participant) =>
              participant.id
          )
      );

    for (const remoteId of peersRef.current.keys()) {
      if (
        !activeIds.has(
          remoteId
        )
      ) {
        removePeer(
          remoteId
        );
      }
    }
  }, [
    joined,
    participants,
    participantId,
    createOfferFor,
    removePeer,
  ]);

  /*
   * --------------------------------------------------
   * CLEANUP ALL PEERS
   * --------------------------------------------------
   */
  const cleanupPeers =
    useCallback(() => {
      for (const {
        connection,
      } of peersRef.current.values()) {
        connection.close();
      }

      peersRef.current.clear();

      pendingIceRef.current.clear();

      readyPeersRef.current.clear();

      screenSendersRef.current.clear();

      cameraStreamIdRef.current.clear();

      extraStreamsRef.current.clear();

      screenInfoRef.current = null;

      setScreenSharer(null);

      setRemoteScreenStream(null);

      setRemoteStreams(
        new Map()
      );
    }, []);

  /*
   * --------------------------------------------------
   * TOGGLE MICROPHONE
   * --------------------------------------------------
   */
  const toggleMic =
    useCallback(() => {
      const track =
        localStreamRef.current
          ?.getAudioTracks()[0];

      if (!track) {
        return;
      }

      track.enabled =
        !track.enabled;

      setMuted(
        !track.enabled
      );
    }, [localStreamRef]);

  /*
   * --------------------------------------------------
   * TOGGLE CAMERA
   * --------------------------------------------------
   */
  const toggleCamera =
    useCallback(() => {
      const track =
        localStreamRef.current
          ?.getVideoTracks()[0];

      if (!track) {
        return;
      }

      track.enabled =
        !track.enabled;

      setCameraOff(
        !track.enabled
      );
    }, [localStreamRef]);

  /*
   * --------------------------------------------------
   * STOP SCREEN SHARE
   * --------------------------------------------------
   *
   * The camera track was never touched, so there is
   * nothing to "restore" - we only remove the extra
   * screen tracks and tell the server we stopped.
   */
  const stopScreenShare =
    useCallback(() => {
      const screenStream =
        screenStreamRef.current;

      if (!screenStream) {
        return;
      }

      const remoteIds = [
        ...screenSendersRef.current.keys(),
      ];

      for (const [
        remoteId,
        senders,
      ] of screenSendersRef.current) {
        const peer =
          peersRef.current.get(
            remoteId
          );

        if (!peer) {
          continue;
        }

        for (const sender of senders) {
          try {
            peer.connection.removeTrack(
              sender
            );
          } catch {
            /*
             * Connection already closed.
             */
          }
        }
      }

      screenSendersRef.current.clear();

      screenStream
        .getTracks()
        .forEach((track) => {
          track.onended = null;
          track.stop();
        });

      screenStreamRef.current =
        null;
      setLocalScreenStream(null);
      setSharing(false);

      sessionStorage.removeItem(
        `revslot:meeting:${_bookingId}:screen-sharing`
      );

      setScreenShareNeedsResume(false);

      socket?.emit("screen:stop");

      for (const remoteId of remoteIds) {
        void renegotiate(
          remoteId
        ).catch(() => undefined);
      }
    }, [
      _bookingId,
      renegotiate,
      socket,
    ]);

  /*
   * --------------------------------------------------
   * SCREEN SHARE
   * --------------------------------------------------
   *
   * Only ONE participant may present at a time
   * (enforced by the server). The screen is sent as an
   * additional video track; the camera keeps streaming.
   */
  const shareScreen =
    useCallback(async () => {
      if (
        !navigator.mediaDevices
          ?.getDisplayMedia
      ) {
        setError(
          "Screen sharing is not supported by this browser."
        );

        return;
      }

      if (sharing) {
        stopScreenShare();
        return;
      }

      if (!socket?.connected) {
        setError(
          "Meeting connection is not available."
        );

        return;
      }

      const currentSharer =
        screenInfoRef.current;

      if (
        currentSharer &&
        currentSharer.participantId !==
          participantId
      ) {
        setError(
          "Someone else is already presenting. Wait until they stop sharing."
        );

        return;
      }

      let screenStream:
        | MediaStream
        | null = null;

      try {
        screenStream =
          await navigator.mediaDevices.getDisplayMedia(
            {
              video: true,
              audio: true,
            }
          );

        const screenTrack =
          screenStream.getVideoTracks()[0];

        if (!screenTrack) {
          screenStream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        /*
         * Ask the server for the (single) presenter slot.
         */
        const claim =
          await new Promise<{
            ok: boolean;
            error?: string;
          }>((resolve) => {
            const timer = setTimeout(
              () =>
                resolve({
                  ok: false,
                  error:
                    "Could not start screen sharing. Please try again.",
                }),
              5000
            );

            socket.emit(
              "screen:start",
              {
                streamId:
                  screenStream!.id,
              },
              (response) => {
                clearTimeout(timer);
                resolve(response);
              }
            );
          });

        if (!claim.ok) {
          screenStream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          setError(
            claim.error ??
              "Someone else is already presenting."
          );

          return;
        }

        screenStreamRef.current =
          screenStream;

        setLocalScreenStream(screenStream);

        /*
         * Browser "Stop sharing" button.
         */
        screenTrack.onended =
          () => {
            stopScreenShare();
          };

        setSharing(true);
        setScreenShareNeedsResume(false);

        sessionStorage.setItem(
          `revslot:meeting:${_bookingId}:screen-sharing`,
          "true"
        );

        for (const remoteId of peersRef.current.keys()) {
          void attachScreenTo(
            remoteId
          ).catch(() => undefined);
        }
      } catch {
        screenStream
          ?.getTracks()
          .forEach((track) =>
            track.stop()
          );

        setSharing(false);
      }
    }, [
      _bookingId,
      attachScreenTo,
      participantId,
      setError,
      sharing,
      socket,
      stopScreenShare,
    ]);

      /*
   * --------------------------------------------------
   * CHECK SCREEN SHARE AFTER REFRESH
   * --------------------------------------------------
   */
  useEffect(() => {
    if (!joined) {
      return;
    }

    const wasSharing =
      sessionStorage.getItem(
        `revslot:meeting:${_bookingId}:screen-sharing`
      ) === "true";

    if (wasSharing) {
      setScreenShareNeedsResume(true);
    }
  }, [joined, _bookingId]);


  /*
   * --------------------------------------------------
   * RESTORE LOCAL VIDEO AFTER JOIN
   * --------------------------------------------------
   */
  useEffect(() => {
    if (joined) {
      setLocalVideo(
        localStreamRef.current
      );
    }
  }, [
    joined,
    localStreamRef,
    setLocalVideo,
  ]);

  /*
   * --------------------------------------------------
   * CLEANUP WHEN LEAVING
   * --------------------------------------------------
   */
  useEffect(() => {
    if (!joined) {
      cleanupPeers();
    }
  }, [
    joined,
    cleanupPeers,
  ]);

  /*
   * --------------------------------------------------
   * FINAL UNMOUNT CLEANUP
   * --------------------------------------------------
   */
  useEffect(() => {
    return () => {
      cleanupPeers();

      screenStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      localStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      screenStreamRef.current =
        null;

      localStreamRef.current =
        null;
    };
  }, [
    cleanupPeers,
    localStreamRef,
  ]);

  return {
    localVideoRef,
    localStreamRef,
    peersRef,
    remoteStreams,
    muted,
    cameraOff,
    sharing,
    screenSharer,
    remoteScreenStream,
    screenShareNeedsResume,
    localScreenStream,
    getLocalMedia,
    stopLocalMedia,
    toggleMic,
    toggleCamera,
    shareScreen,
    cleanupPeers,
  };
}