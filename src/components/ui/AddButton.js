import { Icons } from "@/components/layout";

export function AddButton({ onClick, label }) {
  return (
    <button onClick={onClick}
      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors shadow-sm">
      <Icons.Plus />
      {label}
    </button>
  );
}
