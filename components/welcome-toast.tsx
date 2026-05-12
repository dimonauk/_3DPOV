"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function WelcomeToast() {
  useEffect(() => {
    // ignore if screen height is too small
    if (window.innerHeight < 650) return;
    if (!document.cookie.includes("holoflow-welcome=1")) {
      toast("You found us.", {
        id: "holoflow-welcome",
        duration: Infinity,
        onDismiss: () => {
          document.cookie =
            "holoflow-welcome=1; max-age=31536000; path=/";
        },
        description:
          "Site is still finding its feet. Studio is open. Look around.",
      });
    }
  }, []);

  return null;
}
