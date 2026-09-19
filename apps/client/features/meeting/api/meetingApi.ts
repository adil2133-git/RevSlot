import api from "@/lib/axios";

import type { MeetingInfo } from "../types/meeting.types";

export const meetingApi = {
  getInfo: async (
    bookingId: number,
    token: string
  ): Promise<MeetingInfo> => {
    const res = await api.get(`/meetings/${bookingId}`, {
      params: { token },
    });

    return res.data.data as MeetingInfo;
  },
};
