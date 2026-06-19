import Link from "next/link";
import { getAvailabilityDot } from "@/lib/utils/tags";
import Avatar from "./Avatar";
import Tag from "./Tag";

export default function AttorneyCard({ a, onContact, href }) {
  let tags = [];
  if (a.tags) {
    try {
      tags = typeof a.tags === "string" ? JSON.parse(a.tags) : a.tags;
    } catch {
      tags = typeof a.tags === "string" ? a.tags.split(",") : [];
    }
  }

  const avail = a.avail || a.availability || "Available now";
  const dot = a.dot || getAvailabilityDot(avail);

  const cardInner = (
    <>
      <div className="flex gap-3 mb-2.5">
        <Avatar initials={a.initials} bg={a.bg} fg={a.fg} photoUrl={a.photoUrl} />
        <div className="min-w-0">
          <div className="text-[15px] font-medium text-text">{a.name}</div>
          <div className="text-xs text-muted">
            {a.location} · {a.exp || `${a.experienceYears || 0} yrs`}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-[5px] mb-2.5">
        {tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      <div className="flex justify-between text-xs items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1">
          <span
            style={{ backgroundColor: dot }}
            className="w-[7px] h-[7px] rounded-full inline-block shrink-0"
          />
          <span className="text-muted">{avail}</span>
        </span>
        <span className="text-amber shrink-0">★ {Number(a.stars || 5.0).toFixed(1)} ({a.reviews || 0})</span>
        <span className="font-medium text-text shrink-0">{a.rate}</span>
      </div>
      {onContact && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContact(a);
          }}
          className="w-full bg-green hover:bg-green-dark text-white font-semibold text-[11px] py-1.5 rounded-lg border-none cursor-pointer transition-all text-center block mt-3"
        >
          Message Attorney
        </button>
      )}
    </>
  );

  const className =
    "bg-white border-[0.5px] border-solid border-[rgba(0,0,0,0.09)] rounded-lg p-5 shadow-sm hover:border-green-medium hover:shadow-md transition-all duration-300 block";

  if (href) {
    return (
      <Link href={href} className={className}>
        {cardInner}
      </Link>
    );
  }

  return <div className={className}>{cardInner}</div>;
}
