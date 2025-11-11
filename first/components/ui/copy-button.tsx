import { Button } from "@/components/ui/button"
import { CopyIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function CopyButton({ string, description, disabled }: { string: string, description: string, disabled?: boolean }) {

  return (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button className="float-right" variant="outline" size="icon" disabled={disabled} onClick={() => {
          navigator.clipboard.writeText(string);
      }}>
        <CopyIcon />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{description}</p>
    </TooltipContent>
  </Tooltip>
  );
}