import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

export function generateTemporaryPassword() {
  return `Tmp-${randomBytes(15).toString("base64url")}`;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
