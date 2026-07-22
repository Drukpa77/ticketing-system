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

export function makeInvoiceNumber() {
  const stamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${stamp}-${rand}`;
}

/** Short reference customers put on their bank transfer. */
export function makeBankReference(bookingRef: string) {
  return bookingRef.replace(/[^A-Z0-9]/gi, "").slice(0, 12).toUpperCase();
}
