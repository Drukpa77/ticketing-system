import { SiteHeader } from "@/components/SiteHeader";
import { getCartCount } from "@/lib/cart";

export async function SiteHeaderShell() {
  let cartCount = 0;
  try {
    cartCount = await getCartCount();
  } catch (err) {
    console.error("getCartCount failed", err);
  }
  return <SiteHeader cartCount={cartCount} />;
}
