import { ChevronRight } from "lucide-react";
import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

type MobileUtilityScreenProps = {
  title: string;
  onBack: () => void;
  variants: Variants;
  children: ReactNode;
  bodyClassName?: string;
};

export function MobileUtilityScreen({
  title,
  onBack,
  variants,
  children,
  bodyClassName = "flex-1 overflow-y-auto p-6",
}: MobileUtilityScreenProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="absolute inset-0 bg-gray-50 dark:bg-[#121212] z-50 flex flex-col rounded-[36px]"
    >
      <div className="pt-12 pb-4 px-6 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-sm shrink-0">
        <button
          onClick={onBack}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <h2 className="font-bold text-xl text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className={bodyClassName} style={{ scrollbarWidth: "none" }}>
        {children}
      </div>
    </motion.div>
  );
}
