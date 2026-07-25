import { getBrand } from "@/lib/branding";

export type EmailAttachment = {
  filename: string;
  content: string;
  contentType?: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
};

export function isEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() ||
      (process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim()),
  );
}

function fromAddress() {
  const brand = getBrand();
  return (
    process.env.EMAIL_FROM?.trim() ||
    `${brand.reservationsTeam} <${brand.supportEmail}>`
  );
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ ok: true; id?: string } | { ok: false; error: string; skipped?: boolean }> {
  try {
    if (!input.to) {
      return { ok: false, error: "Missing recipient email" };
    }

    if (process.env.RESEND_API_KEY?.trim()) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: fromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content, "utf8"),
          contentType: a.contentType || "text/html",
        })),
      });
      if (result.error) {
        return { ok: false, error: result.error.message };
      }
      return { ok: true, id: result.data?.id };
    }

    if (process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim()) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || "",
        },
      });
      const info = await transporter.sendMail({
        from: fromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType || "text/html",
        })),
      });
      return { ok: true, id: info.messageId };
    }

    console.info("[email:skipped]", {
      to: input.to,
      subject: input.subject,
      reason: "No RESEND_API_KEY or SMTP_* configured",
    });
    return {
      ok: false,
      skipped: true,
      error:
        "Email not configured. Set RESEND_API_KEY or SMTP_HOST/SMTP_USER in .env",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email";
    console.error("[email:error]", message);
    return { ok: false, error: message };
  }
}
