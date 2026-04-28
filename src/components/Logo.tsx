import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
      <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-base leading-none">태</span>
      </div>
      <span className="text-lg font-bold text-stone-900 tracking-tight">태백식품</span>
    </Link>
  );
}
