"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AntiHallucinationToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function AntiHallucinationToggle({
  enabled,
  onToggle,
}: AntiHallucinationToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Shield
          className={`h-4 w-4 ${enabled ? "text-emerald-500" : "text-muted-foreground"}`}
        />
        <Label htmlFor="anti-hallucination" className="text-sm font-medium">
          Source Verification
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              When enabled, highlights text with high confidence scores (80%+)
              and shows source attribution with tooltips.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Switch
        id="anti-hallucination"
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}
