import type { CrewStatus, SideKind } from '../lib/crewHelpers';

export function StatusBadge({ status }: { status: CrewStatus }) {
  if (status === 'confirmed') {
    return (
      <span className="badge lime">
        <span className="b-dot"></span>Confirmed
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="badge danger">
        <span className="b-dot"></span>Cancelled
      </span>
    );
  }
  return (
    <span className="badge warn">
      <span className="b-dot"></span>Draft
    </span>
  );
}

export function SideTag({ side }: { side: SideKind }) {
  if (side === 'port') return <span className="side-p">PORT</span>;
  if (side === 'starboard') return <span className="side-s">STBD</span>;
  if (side === 'cox') return <span className="side-cox">COX</span>;
  if (side === 'both') return <span className="side-none">PORT/STBD</span>;
  return <span className="side-none">—</span>;
}
