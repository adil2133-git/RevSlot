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
} from "../types/meeting.types";
import type { MeetingSocket } from "../socket/meetingSocket";

const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: "stun:stun1.l.google.com:19302",
  },
];

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

  const peersRef =
    useRef<Map<string, PeerState>>(
      new Map()
    );

  const pendingIceRef =
    useRef<Map<string, RTCIceCandidateInit[]>>(
      new Map()
    );

  const [
    remoteStreams,
    setRemoteStreams,
  ] = useState<Map<string, MediaStream>>(
    new Map()
  );

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
    }, [
      localStreamRef,
      setLocalVideo,
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
   * REMOVE PEER
   * --------------------------------------------------
   */
  const removePeer = useCallback(
    (remoteId: string) => {
      const peer =
        peersRef.current.get(
          remoteId
        );

      peer?.connection.close();

      peersRef.current.delete(
        remoteId
      );

      pendingIceRef.current.delete(
        remoteId
      );

      setRemoteStreams(
        (current) => {
          const next =
            new Map(current);

          next.delete(remoteId);

          return next;
        }
      );
    },
    []
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
        return existing.connection;
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

      /*
       * Peer connection lifecycle
       */
      connection.onconnectionstatechange =
        () => {
          const state =
            connection.connectionState;

          if (
            state === "failed" ||
            state === "closed" ||
            state ===
              "disconnected"
          ) {
            removePeer(
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
   * RESTORE CAMERA AFTER SCREEN SHARE
   * --------------------------------------------------
   */
  const restoreCameraAfterScreenShare =
    useCallback(() => {
      const cameraTrack =
        localStreamRef.current
          ?.getVideoTracks()[0];

      if (cameraTrack) {
        for (const {
          connection,
        } of peersRef.current.values()) {
          const sender =
            connection
              .getSenders()
              .find(
                (item) =>
                  item.track
                    ?.kind ===
                  "video"
              );

          if (sender) {
            void sender
              .replaceTrack(
                cameraTrack
              )
              .catch(() => undefined);
          }
        }
      }

      screenStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      screenStreamRef.current =
        null;

      setLocalVideo(
        localStreamRef.current
      );

      setSharing(false);
      sessionStorage.removeItem(
         `revslot:meeting:${_bookingId}:screen-sharing`
      );
      setScreenShareNeedsResume(false);
    }, [
      localStreamRef,
      setLocalVideo,
    ]);

  /*
   * --------------------------------------------------
   * SCREEN SHARE
   * --------------------------------------------------
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

      /*
       * Stop current screen share.
       */
      if (sharing) {
        restoreCameraAfterScreenShare();
        return;
      }

      try {
        const screenStream =
          await navigator.mediaDevices.getDisplayMedia(
            {
              video: true,
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

        screenStreamRef.current =
          screenStream;

        /*
         * Replace camera track
         * with screen track.
         */
        for (const {
          connection,
        } of peersRef.current.values()) {
          const sender =
            connection
              .getSenders()
              .find(
                (item) =>
                  item.track
                    ?.kind ===
                  "video"
              );

          if (sender) {
            await sender.replaceTrack(
              screenTrack
            );
          }
        }

        setLocalVideo(
          screenStream
        );

        setSharing(true);
        setScreenShareNeedsResume(false);

        sessionStorage.setItem(
          `revslot:meeting:${_bookingId}:screen-sharing`,
          "true"
        );

        /*
         * Browser stop-sharing button
         * also restores camera.
         */
        screenTrack.onended =
          () => {
            restoreCameraAfterScreenShare();
          };
      } catch {
        setSharing(false);
      }
    }, [
      sharing,
      restoreCameraAfterScreenShare,
      setError,
      setLocalVideo,
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
    screenShareNeedsResume,
    getLocalMedia,
    stopLocalMedia,
    toggleMic,
    toggleCamera,
    shareScreen,
    cleanupPeers,
  };
}