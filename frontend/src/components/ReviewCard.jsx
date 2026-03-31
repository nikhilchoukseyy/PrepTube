const ReviewCard = ({ r }) => (
  <div
    className={`w-[280px] shrink-0 rounded-2xl border border-white/8 bg-gradient-to-br ${r.gradient} p-5`}
  >
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
        {r.username[0]}
      </div>
      <div>
        <p className="text-xs font-semibold text-white">{r.username}</p>
        <p className="text-[10px] text-white/35">{r.role}</p>
      </div>
      <div className="ml-auto flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-amber-400 text-xs">★</span>
        ))}
      </div>
    </div>
    <p className="text-sm leading-relaxed text-white/65">&quot;{r.review}&quot;</p>
  </div>
);

export default ReviewCard;