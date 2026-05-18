import { useState } from 'react';
import type { CrewSuggestion } from '../../types';
import Icon from '../Icon';

interface Props {
  suggestion: CrewSuggestion;
  onAccept?: () => Promise<void> | void;
  disabled?: boolean;
  disabledReason?: string;
}

export default function SuggestionCard({ suggestion, onAccept, disabled, disabledReason }: Props) {
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    if (!onAccept || disabled) return;
    setBusy(true);
    try {
      await onAccept();
    } finally {
      setBusy(false);
    }
  };

  const sourceLabel =
    suggestion.source === 'template'
      ? suggestion.template_name
        ? `${suggestion.template_name}${suggestion.missing_from_template?.length ? ` − ${suggestion.missing_from_template.length}` : ''}`
        : 'Template'
      : '';

  return (
    <div className="suggestion">
      <div className="suggestion-top">
        <span className="boat-tag">{suggestion.boat_type}</span>
        {sourceLabel && (
          <span className="badge water" style={{ marginLeft: 0 }}>
            <span className="b-dot"></span>
            {sourceLabel}
          </span>
        )}
        <div className="score-bar">
          <span>score</span>
          <div className="score-fill">
            <div style={{ width: `${Math.min(100, suggestion.score)}%` }}></div>
          </div>
          <span style={{ color: 'var(--text-0)' }}>{suggestion.score}</span>
        </div>
      </div>
      <ul className="crew-list">
        {suggestion.rowers.map((r, i) => (
          <li key={`${r.id}-${i}`}>
            <span className="pos">{i + 1}</span>
            <span>{r.name}</span>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn sm primary" disabled={disabled || busy} onClick={accept} title={disabled ? disabledReason : undefined}>
          <Icon name="check" size={11} /> Accept
        </button>
        {disabled && disabledReason && (
          <span className="mono muted" style={{ fontSize: 11, alignSelf: 'center' }}>
            {disabledReason}
          </span>
        )}
      </div>
    </div>
  );
}
