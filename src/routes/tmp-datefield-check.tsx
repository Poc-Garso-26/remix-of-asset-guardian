import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DateField } from "@/components/date-field";

export const Route = createFileRoute("/tmp-datefield-check")({ component: P });

function P() {
  const [v, setV] = useState("");
  return (
    <div>
      <label htmlFor="d">Aquisição de</label>
      <DateField id="d" value={v} onChange={setV} />
      <output data-testid="iso">{v}</output>
    </div>
  );
}
