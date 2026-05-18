import type { ReactNode } from 'react';

interface Props {
  title: string;
  hint?: ReactNode;
  trailing?: ReactNode;
}

export default function SectionTitle({ title, hint, trailing }: Props) {
  return (
    <div className="section-title">
      <h3>{title}</h3>
      {hint && <span className="hint">{hint}</span>}
      {trailing && (
        <>
          <div className="spacer"></div>
          {trailing}
        </>
      )}
    </div>
  );
}
