import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const EMAIL_VERIFICATION_SECRET = process.env.EMAIL_VERIFICATION_SECRET as string;

if (!ACCESS_SECRET || !REFRESH_SECRET || !EMAIL_VERIFICATION_SECRET) {
    throw new Error("JWT secrets are not set in environment variables")
}

export interface TokenPayload {
    userId : number;
    role : "reviewer" | "admin";
}

// for AccessToken
export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, ACCESS_SECRET, {expiresIn: "15m"})
}

export const verifyAccessToken = (token: string): TokenPayload=> {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload
}


//for RefreshToken
export const generateRefreshToken =(payload: TokenPayload): string=>{
    return jwt.sign(payload, REFRESH_SECRET, {expiresIn: "7d"})
}

export const verifyRefreshToken = (token: string): TokenPayload=>{
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}

// for Email Verification Token
export const generateEmailVerificationToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, EMAIL_VERIFICATION_SECRET, { expiresIn: "24h" })
}

export const verifyEmailVerificationToken = (token: string): TokenPayload => {
    return jwt.verify(token, EMAIL_VERIFICATION_SECRET) as TokenPayload;
}

// Never store the raw refresh token in the DB — only its hash. The raw
// token lives solely in the httpOnly cookie on the client. This lets
// the server check "is this specific token still valid/unrevoked"
// without a DB leak exposing anything directly usable — same principle
// as password hashing, not for secrecy of the algorithm (SHA-256 here
// is fine since this isn't protecting a low-entropy secret like a
// password; the JWT itself is already high-entropy and signature-
// verified separately via verifyRefreshToken above).
export const hashRefreshToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex");
}