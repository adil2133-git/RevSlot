import jwt from "jsonwebtoken";

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