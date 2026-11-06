// One round trip tells the whole app which of the four products this account owns.
//
// It is the only place an entitlement is read, because the page cannot be the
// judge: a lock drawn from localStorage was removable with dev tools, and the
// old single `workspace_unlocked` flag said yes to any confirmed order of any
// size, which meant a ₹100 session opened the sheet too. The database now
// answers per product, so a student who paid for one rail sees that rail open
// and the others still locked.
//
// The answer is still only a UI hint - the judged submissions and the decks each
// check the server too, or are worthless by construction.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { codexSheetProducts, type ProductId } from "./products";

export type Unlocks = {
  loaded: boolean;
  /** Aditya and any approved mentor see everything. */
  mentor: boolean;
  owned: Record<ProductId, boolean>;
  /** Re-read the ledger - the checkout page calls it after a claim lands. */
  refresh: () => Promise<void>;
};

const everything: Record<ProductId, boolean> = Object.fromEntries(
  codexSheetProducts.map((product) => [product.id, true]),
) as Record<ProductId, boolean>;

const nothing: Record<ProductId, boolean> = Object.fromEntries(
  codexSheetProducts.map((product) => [product.id, false]),
) as Record<ProductId, boolean>;

const emptyFlags = { loaded: false, mentor: false, owned: nothing };

export function useUnlocks(userId: string | null, verifiedEmail = false): Unlocks {
  const [state, setState] = useState<Omit<Unlocks, "refresh">>(emptyFlags);

  const refresh = useCallback(async () => {
    // With no Supabase env this is a dev build: nothing is locked, the same way
    // the sheet lock behaved before there were products.
    if (!supabase) { setState({ loaded: true, mentor: false, owned: everything }); return; }
    const [{ data: products }, { data: mentor }] = await Promise.all([
      supabase.rpc("codexsheet_unlock_status"),
      supabase.rpc("is_workspace_mentor"),
    ]);
    const flags = (products ?? {}) as Record<string, boolean>;
    setState({
      loaded: true,
      mentor: Boolean(mentor),
      owned: Object.fromEntries(
        codexSheetProducts.map((product) => [product.id, Boolean(flags[product.id])]),
      ) as Record<ProductId, boolean>,
    });
  }, []);

  // The ledger is keyed on the Clerk id, or on the verified email of an order paid
  // without signing in, so there is nothing to read until one of those exists.
  useEffect(() => {
    setState(emptyFlags);
    if (userId || verifiedEmail) void refresh();
  }, [userId, verifiedEmail, refresh]);

  return { ...state, refresh };
}

/** Does this account get the rail the product opens? Mentors and old all-access payers always do. */
export function unlocksRail(unlocks: Unlocks, product: ProductId): boolean {
  return unlocks.mentor || unlocks.owned[product];
}
