import { CheckIcon, DocumentIcon, DotGrid, LightbulbIcon } from "./icons";

export function SideDecoration() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden xl:block"
    >
      <DocumentIcon className="motion-safe:animate-float-slow-1 absolute left-[6%] top-[14%] h-32 w-32 text-emerald-300/[0.08]" />
      <DotGrid className="absolute left-[9%] top-[46%] h-16 w-14 text-emerald-300/[0.12]" />

      <LightbulbIcon className="motion-safe:animate-float-slow-2 absolute right-[6%] top-[20%] h-28 w-28 text-emerald-300/[0.08]" />
      <CheckIcon className="absolute bottom-[22%] right-[10%] h-9 w-9 text-white/[0.1]" />
    </div>
  );
}
