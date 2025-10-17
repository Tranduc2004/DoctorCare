import React from "react";
import { validateToken, getTokenInfo } from "../utils/tokenUtils";

interface AuthDebugProps {
  token: string | null;
  admin: any;
  isAuthenticated: boolean;
  show?: boolean;
}

const AuthDebugPanel: React.FC<AuthDebugProps> = ({
  token,
  admin,
  isAuthenticated,
  show = import.meta.env.DEV,
}) => {
  if (!show) return null;

  const tokenValidation = token ? validateToken(token) : null;
  const tokenInfo = token ? getTokenInfo(token) : null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs">
        <h4 className="font-bold mb-2 text-yellow-400">Auth Debug</h4>

        <div className="space-y-1">
          <div>
            <span className="text-gray-300">Has Token:</span>{" "}
            <span className={token ? "text-green-400" : "text-red-400"}>
              {token ? "Yes" : "No"}
            </span>
          </div>

          <div>
            <span className="text-gray-300">Token Length:</span>{" "}
            <span className="text-blue-400">{token?.length || 0}</span>
          </div>

          <div>
            <span className="text-gray-300">Is Authenticated:</span>{" "}
            <span
              className={isAuthenticated ? "text-green-400" : "text-red-400"}
            >
              {isAuthenticated ? "Yes" : "No"}
            </span>
          </div>

          <div>
            <span className="text-gray-300">Admin:</span>{" "}
            <span className="text-purple-400">{admin?.username || "None"}</span>
          </div>

          {tokenValidation && (
            <>
              <div>
                <span className="text-gray-300">Token Valid:</span>{" "}
                <span
                  className={
                    tokenValidation.isValid ? "text-green-400" : "text-red-400"
                  }
                >
                  {tokenValidation.isValid ? "Yes" : "No"}
                </span>
              </div>

              <div>
                <span className="text-gray-300">Token Expired:</span>{" "}
                <span
                  className={
                    tokenValidation.isExpired
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {tokenValidation.isExpired ? "Yes" : "No"}
                </span>
              </div>
            </>
          )}

          {tokenInfo && (
            <>
              <div>
                <span className="text-gray-300">Expires:</span>{" "}
                <span className="text-yellow-400">
                  {tokenInfo.expiresAt.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-gray-300">Role:</span>{" "}
                <span className="text-cyan-400">{tokenInfo.role}</span>
              </div>
            </>
          )}

          {tokenValidation?.error && (
            <div className="text-red-400 mt-2">
              Error: {tokenValidation.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPanel;
