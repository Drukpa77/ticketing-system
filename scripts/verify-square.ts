import "dotenv/config";
import { SquareClient, SquareEnvironment, SquareError } from "square";
import {
  getSquarePublicConfig,
  isSquareConfigured,
} from "../src/lib/payments/square";
import {
  getBankTransferDetails,
  isBankTransferConfigured,
} from "../src/lib/payments/bank";

async function main() {
  const pub = getSquarePublicConfig();
  console.log("square.configured:", isSquareConfigured());
  console.log("square.environment:", pub.environment);
  console.log(
    "appId looks sandbox:",
    pub.applicationId.startsWith("sandbox-"),
  );
  console.log("locationId set:", Boolean(pub.locationId));
  console.log("bank.configured:", isBankTransferConfigured());
  const bank = getBankTransferDetails();
  if (bank) {
    console.log("bank.accountName:", bank.accountName);
  }

  if (!process.env.SQUARE_ENVIRONMENT) {
    console.log("note: SQUARE_ENVIRONMENT unset → defaults to sandbox (OK)");
  }

  if (!isSquareConfigured()) {
    console.log("RESULT: FAIL - missing Square env vars");
    process.exit(1);
  }

  const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Sandbox,
  });

  try {
    const res = await client.locations.list();
    const locations = res.locations ?? [];
    console.log("locations.count:", locations.length);
    for (const loc of locations) {
      console.log(
        "-",
        loc.id,
        "|",
        loc.name,
        "|",
        loc.status,
        "|",
        loc.currency,
      );
    }

    const match = locations.find(
      (l) => l.id === process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
    );
    if (!match) {
      console.log(
        "RESULT: FAIL - Location ID does not match this sandbox account",
      );
      process.exit(1);
    }

    console.log("location.match: OK");
    if (match.currency && match.currency !== "AUD") {
      console.log(
        "WARNING: location currency is",
        match.currency,
        "- app charges in AUD",
      );
    }

    console.log("RESULT: OK - Square sandbox credentials work");
  } catch (error) {
    if (error instanceof SquareError) {
      console.log(
        "RESULT: FAIL -",
        error.errors?.[0]?.detail || error.message,
      );
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
