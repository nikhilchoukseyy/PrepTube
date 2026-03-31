import { Link } from "react-router-dom";
import { IC } from "../pages/Icons";

const UpgradePromptBanner = ({ message = "This room is full on the free plan.", className = "" }) => {
  return (
    <div className={`rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5 text-left">
          <IC.Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div>
            <p className="text-sm font-semibold text-amber-100">Upgrade required</p>
            <p className="mt-1 text-sm font-medium text-amber-100/80">{message}</p>
          </div>
        </div>

        <Link
          to="/pricing"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
        >
          Upgrade to Pro
          <IC.ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default UpgradePromptBanner;
