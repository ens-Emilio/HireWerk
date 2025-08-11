import crypto from "node:crypto";

function b64url(input: Buffer | string) {
  const base = (typeof input === "string" ? Buffer.from(input) : input).toString("base64");
  return base.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecodeToString(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = input.length % 4 ? 4 - (input.length % 4) : 0;
  const withPad = input + "=".repeat(pad);
  return Buffer.from(withPad, "base64").toString("utf8");
}

export type ExportTokenPayload = {
  sub: string; // user id
  rid: string; // resume id
  exp: number; // epoch seconds
};

const getSecret = () => {
  const secret = process.env.EXPORT_TOKEN_SECRET;
  if (!secret) throw new Error("Falta EXPORT_TOKEN_SECRET no ambiente");
  return secret;
};

export function signExportToken(payload: ExportTokenPayload) {
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(data);
  const sig = hmac.digest();
  return `${b64url(data)}.${b64url(sig)}`;
}

export function verifyExportToken(token: string): ExportTokenPayload | null {
  const [dataPart, sigPart] = token.split(".");
  if (!dataPart || !sigPart) return null;
  const dataStr = b64urlDecodeToString(dataPart);
  let json: ExportTokenPayload;
  try {
    json = JSON.parse(dataStr);
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!json.exp || json.exp < now) return null;
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(dataStr);
  const expected = b64url(hmac.digest());
  if (expected !== sigPart) return null;
  return json;
}
