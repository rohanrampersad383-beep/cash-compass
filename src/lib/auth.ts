import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "cash_compass_session";
const LEGACY_SESSION_COOKIE = "financial_tracks_session";
const SESSION_IDLE_DAYS = 14;
const SESSION_ABSOLUTE_DAYS = 30;

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  currencyCode: string;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_IDLE_DAYS * 24 * 60 * 60 * 1000);
}

function absoluteSessionExpiresAt(createdAt: Date) {
  return new Date(createdAt.getTime() + SESSION_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000);
}

function clearSessionCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(LEGACY_SESSION_COOKIE);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createUserSession(userId: string) {
  const cookieStore = await cookies();
  const existingTokens = [cookieStore.get(SESSION_COOKIE)?.value, cookieStore.get(LEGACY_SESSION_COOKIE)?.value].filter(
    Boolean,
  ) as string[];
  const token = randomBytes(32).toString("base64url");
  const expiresAt = sessionExpiresAt();

  if (existingTokens.length) {
    await prisma.session.deleteMany({
      where: {
        sessionHash: { in: existingTokens.map(hashSessionToken) },
      },
    });
  }

  await prisma.session.create({
    data: {
      sessionHash: hashSessionToken(token),
      userId,
      expiresAt,
    },
  });

  clearSessionCookies(cookieStore);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionHash: hashSessionToken(token) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerifiedAt: true,
          currencyCode: true,
        },
      },
    },
  });

  const now = new Date();
  const absoluteExpiresAt = session ? absoluteSessionExpiresAt(session.createdAt) : null;

  if (!session || session.expiresAt < now || (absoluteExpiresAt && absoluteExpiresAt < now)) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    clearSessionCookies(cookieStore);
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const tokens = [cookieStore.get(SESSION_COOKIE)?.value, cookieStore.get(LEGACY_SESSION_COOKIE)?.value].filter(
    Boolean,
  ) as string[];

  if (tokens.length) {
    await prisma.session.deleteMany({
      where: { sessionHash: { in: tokens.map(hashSessionToken) } },
    });
  }

  clearSessionCookies(cookieStore);
}

export async function destroyAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });

  const cookieStore = await cookies();
  clearSessionCookies(cookieStore);
}
