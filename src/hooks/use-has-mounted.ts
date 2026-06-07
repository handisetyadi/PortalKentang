import { useEffect, useState } from "react";

/** True after the component has mounted — use to defer browser-only UI during hydration. */
export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
