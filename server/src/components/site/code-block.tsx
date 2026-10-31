"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CodeBlock({
  code,
  label = "Terminal",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(false);
    } catch {
      setError(true);
      setCopied(false);
    }
  }
  return (
    <div className="code-block">
      <div className="code-header">
        <span>{label}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copy}
          aria-label={`Copy ${label}`}
          onBlur={() => setCopied(false)}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre tabIndex={0} aria-label={label}>
        <code>{code}</code>
      </pre>
      {error && (
        <p role="status">
          Copy is unavailable here. Select the command above to copy it
          manually.
        </p>
      )}
    </div>
  );
}
