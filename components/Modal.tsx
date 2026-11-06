import type { ReactNode } from "react";

export function Modal({ ribbon, children }: { ribbon: string; children: ReactNode }) {
  return (
    <div className="overlay show">
      <div className="modal" role="dialog" aria-label={ribbon}>
        <div className="ribbon">{ribbon}</div>
        {children}
      </div>
    </div>
  );
}

export function AdTag() {
  return <span className="adtag">AD</span>;
}

export function Coin({ size }: { size?: number }) {
  return <span className="coin" style={size ? { width: size, height: size, verticalAlign: -3 } : undefined} />;
}
