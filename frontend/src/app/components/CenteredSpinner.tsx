import { Loader2 } from "lucide-react";

type CenteredSpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = { sm: "w-5 h-5", md: "w-6 h-6", lg: "w-8 h-8" } as const;

export function CenteredSpinner({ className = "p-12", size = "md" }: CenteredSpinnerProps) {
  return (
    <div className={`flex justify-center text-gray-500 ${className}`}>
      <Loader2 className={`${sizeClass[size]} animate-spin text-blue-600`} />
    </div>
  );
}
