import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function SubmitButton({
  text,
  variant,
  className,
  isPending,
}: SubmitButtonProps) {
  return (
    <>
      {isPending ? (
        <Button
          disabled
          variant="outline"
          className={cn(
            "w-fit bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-medium h-11 text-base shadow-lg",
            className
          )}
        >
          <Loader2 className="size-4 mr-2 animate-spin" />
          Please wait
        </Button>
      ) : (
        <Button
          className={cn(
            "w-fit bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-medium h-11 text-base shadow-lg",
            className
          )}
          type="submit"
          variant={variant}
        >
          {text}
        </Button>
      )}
    </>
  );
}
