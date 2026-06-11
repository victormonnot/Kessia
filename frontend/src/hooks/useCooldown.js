import { useEffect, useState } from "react";

// Countdown used to cool down "resend email" buttons after a click, so users
// get clear feedback instead of hitting the backend rate limit (429).
export default function useCooldown(seconds = 60) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  return {
    remaining,
    active: remaining > 0,
    start: () => setRemaining(seconds),
  };
}
