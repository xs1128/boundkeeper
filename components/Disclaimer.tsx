import { FIXED_DISCLAIMER } from "@/src/analysis/disclaimer";

export function Disclaimer() {
  return (
    <footer className="disclaimer" aria-label="法律資訊聲明">
      {FIXED_DISCLAIMER}
    </footer>
  );
}
