import type { TokenPayload } from "../utils/jwt.js";

export type MeetingIdentity =
  | { role: "reviewer"; reviewerId: number }
  | { role: "advisor"; advisorEmail: string };

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      meetingIdentity?: MeetingIdentity;
    }
  }
}

export {};