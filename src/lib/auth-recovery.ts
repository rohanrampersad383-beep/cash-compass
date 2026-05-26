import { hashPassword } from "@/lib/auth";
import {
  createAuthToken,
  EMAIL_VERIFICATION_TOKEN_MINUTES,
  genericAuthRecoveryResponse,
  hashAuthToken,
  isAuthTokenUsable,
  PASSWORD_RESET_TOKEN_MINUTES,
} from "@/lib/auth-tokens";
import { authActionUrl, sendAuthMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

type MailUser = {
  id: string;
  name: string;
  email: string;
};

function passwordResetMessage(user: MailUser, actionUrl: string) {
  return {
    subject: "Reset your Cash Compass password",
    text: `Hi ${user.name}, reset your Cash Compass password here: ${actionUrl}. This link expires soon. If you did not request this, ignore this email.`,
    html: `<p>Hi ${user.name},</p><p>Reset your Cash Compass password using this secure link:</p><p><a href="${actionUrl}">Reset password</a></p><p>This link expires soon. If you did not request this, ignore this email.</p>`,
  };
}

function verificationMessage(user: MailUser, actionUrl: string) {
  return {
    subject: "Verify your Cash Compass email",
    text: `Hi ${user.name}, verify your Cash Compass email here: ${actionUrl}. This link expires soon.`,
    html: `<p>Hi ${user.name},</p><p>Verify your Cash Compass email using this secure link:</p><p><a href="${actionUrl}">Verify email</a></p><p>This link expires soon.</p>`,
  };
}

export function genericRecoveryResponse() {
  return genericAuthRecoveryResponse();
}

export async function sendPasswordResetLink(user: MailUser) {
  const token = createAuthToken(new Date(), PASSWORD_RESET_TOKEN_MINUTES);

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      tokenHash: token.tokenHash,
      userId: user.id,
      expiresAt: token.expiresAt,
    },
  });

  const actionUrl = authActionUrl("/reset-password", token.rawToken);
  const message = passwordResetMessage(user, actionUrl);
  const delivery = await sendAuthMail({
    to: user.email,
    type: "password-reset",
    actionUrl,
    ...message,
  });

  if (!delivery.ok) {
    console.warn("Cash Compass password reset email was queued internally but not delivered. Check email provider configuration.");
  }
}

export async function sendEmailVerificationLink(user: MailUser) {
  const token = createAuthToken(new Date(), EMAIL_VERIFICATION_TOKEN_MINUTES);

  await prisma.emailVerificationToken.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.emailVerificationToken.create({
    data: {
      tokenHash: token.tokenHash,
      userId: user.id,
      expiresAt: token.expiresAt,
    },
  });

  const actionUrl = authActionUrl("/verify-email", token.rawToken);
  const message = verificationMessage(user, actionUrl);
  const delivery = await sendAuthMail({
    to: user.email,
    type: "email-verification",
    actionUrl,
    ...message,
  });

  if (!delivery.ok) {
    console.warn("Cash Compass verification email was queued internally but not delivered. Check email provider configuration.");
  }
}

export async function resetPasswordWithToken(rawToken: string, password: string) {
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashAuthToken(rawToken) },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      consumedAt: true,
    },
  });

  if (!token || !isAuthTokenUsable(token)) {
    return false;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: token.userId } }),
  ]);

  return true;
}

export async function verifyEmailWithToken(rawToken: string) {
  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashAuthToken(rawToken) },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      consumedAt: true,
    },
  });

  if (!token || !isAuthTokenUsable(token)) {
    return false;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  return true;
}
