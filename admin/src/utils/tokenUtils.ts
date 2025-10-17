import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  adminId: string;
  username: string;
  role: string;
  exp: number;
  iat: number;
}

export const validateToken = (
  token: string | null
): {
  isValid: boolean;
  isExpired: boolean;
  payload?: TokenPayload;
  error?: string;
} => {
  if (!token) {
    return {
      isValid: false,
      isExpired: false,
      error: "No token provided",
    };
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;
    const isExpired = decoded.exp < currentTime;

    console.log("Token validation:", {
      decoded,
      currentTime,
      expirationTime: decoded.exp,
      isExpired,
      timeUntilExpiry: decoded.exp - currentTime,
    });

    return {
      isValid: !isExpired,
      isExpired,
      payload: decoded,
    };
  } catch (error) {
    console.error("Token decode error:", error);
    return {
      isValid: false,
      isExpired: false,
      error: "Invalid token format",
    };
  }
};

export const getTokenInfo = (token: string | null) => {
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return {
      adminId: decoded.adminId,
      username: decoded.username,
      role: decoded.role,
      expiresAt: new Date(decoded.exp * 1000),
      issuedAt: new Date(decoded.iat * 1000),
    };
  } catch (error) {
    console.error("Error getting token info:", error);
    return null;
  }
};
