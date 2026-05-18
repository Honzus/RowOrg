import type { User, UserMinimal } from '../types';

type AvatarUser = Pick<User, 'id' | 'first_name' | 'last_name'> | UserMinimal | null | undefined;

interface Props {
  user: AvatarUser;
  size?: number;
}

const TINTS = ['water', 'coral', 'lime'] as const;
type Tint = (typeof TINTS)[number];

function tintForId(id: number): Tint {
  return TINTS[id % TINTS.length];
}

function initials(user: NonNullable<AvatarUser>): string {
  const a = user.first_name?.[0] ?? '';
  const b = user.last_name?.[0] ?? '';
  const combined = (a + b).toUpperCase();
  return combined || '?';
}

export default function Avatar({ user, size = 24 }: Props) {
  if (!user) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--bg-3)',
          flexShrink: 0,
        }}
      />
    );
  }

  const tint = tintForId(user.id);
  const bg =
    tint === 'lime'
      ? 'linear-gradient(135deg, #b6f06a, #6ab022)'
      : tint === 'water'
        ? 'linear-gradient(135deg, #66a7ff, #2c6fd6)'
        : 'linear-gradient(135deg, #ff5d3a, #c5350f)';
  const color = tint === 'lime' ? '#0a1500' : '#fff';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        fontSize: Math.round(size * 0.42),
        fontWeight: 600,
        color,
        background: bg,
        flexShrink: 0,
        boxShadow: '0 0 0 1px rgba(255,255,255,.08) inset',
        letterSpacing: '-.02em',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {initials(user)}
    </div>
  );
}
