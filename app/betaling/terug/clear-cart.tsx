'use client';

import { useEffect } from "react";

export default function ClearCartAfterPayment({ paid }: { paid: boolean }) {
  useEffect(() => {
    if (paid) {
      try { localStorage.removeItem("bendemen-cart"); } catch { /* storage may be disabled */ }
    }
  }, [paid]);
  return null;
}
