import "dotenv/config";
import Stripe from "stripe";
import { getStripePublicConfig, isStripeConfigured } from "../src/lib/payments/stripe";
import {
  getBankTransferDetails,
  isBankTransferConfigured,
} from "../src/lib/payments/bank";

async function main() {
  const pub = getStripePublicConfig();
  console.log("stripe.configured:", isStripeConfigured());
  console.log(
    "publishableKey looks test mode:",
    pub.publishableKey.startsWith("pk_test_"),
  );
  console.log("bank.configured:", isBankTransferConfigured());
  const bank = getBankTransferDetails();
  if (bank) {
    console.log("bank.accountName:", bank.accountName);
  }

  if (!isStripeConfigured()) {
    console.log("RESULT: FAIL - missing Stripe env vars");
    process.exit(1);
  }

  const secretKey = process.env.STRIPE_SECRET_KEY!;
  const secretIsTest = secretKey.startsWith("sk_test_");
  const publishableIsTest = pub.publishableKey.startsWith("pk_test_");
  if (secretIsTest !== publishableIsTest) {
    console.log(
      "RESULT: FAIL - STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY are from different modes (test vs live)",
    );
    process.exit(1);
  }

  const client = new Stripe(secretKey);

  try {
    const account = await client.accounts.retrieve();
    console.log("account.id:", account.id);
    console.log("account.country:", account.country);
    console.log("account.default_currency:", account.default_currency);
    if (account.default_currency && account.default_currency !== "aud") {
      console.log(
        "WARNING: account default currency is",
        account.default_currency,
        "- app charges in AUD",
      );
    }
    console.log(
      "RESULT: OK - Stripe credentials work (%s mode)",
      secretIsTest ? "test" : "live",
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.log("RESULT: FAIL -", error.message);
    } else {
      console.log(
        "RESULT: FAIL -",
        error instanceof Error ? error.message : String(error),
      );
    }
    process.exit(1);
  }
}

main();
