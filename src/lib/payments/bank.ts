export type BankTransferDetails = {
  accountName: string;
  bsb: string;
  accountNumber: string;
  bankName: string;
};

export function getBankTransferDetails(): BankTransferDetails | null {
  const accountName = process.env.BANK_ACCOUNT_NAME?.trim();
  const bsb = process.env.BANK_BSB?.trim();
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER?.trim();
  const bankName = process.env.BANK_NAME?.trim() || "Bank transfer";

  if (!accountName || !bsb || !accountNumber) return null;

  return { accountName, bsb, accountNumber, bankName };
}

export function isBankTransferConfigured() {
  return getBankTransferDetails() !== null;
}

export { makeInvoiceNumber } from "@/lib/branding";

/** Prefer full booking reference (template style). */
export function makeBankReference(bookingRef: string) {
  return bookingRef;
}
