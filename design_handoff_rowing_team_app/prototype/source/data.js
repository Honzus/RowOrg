// Mock data for ROWORG prototype
window.RowOrgData = (() => {
  const TEAM = [
    { id: 1, first_name: 'Alex',     last_name: 'Kovač',     role: 'oarsman',  sweep_side: 'port',       rowing_type: 'both',     can_cox: false, weight: 84, init: 'AK', tint: 'water' },
    { id: 2, first_name: 'Maya',     last_name: 'Renner',    role: 'oarsman',  sweep_side: 'starboard',  rowing_type: 'sweeping', can_cox: false, weight: 71, init: 'MR', tint: 'coral' },
    { id: 3, first_name: 'Théo',     last_name: 'Marchand',  role: 'oarsman',  sweep_side: 'port',       rowing_type: 'both',     can_cox: false, weight: 88, init: 'TM', tint: 'water' },
    { id: 4, first_name: 'Sofia',    last_name: 'Bauer',     role: 'oarsman',  sweep_side: 'starboard',  rowing_type: 'both',     can_cox: false, weight: 74, init: 'SB', tint: 'coral' },
    { id: 5, first_name: 'Luca',     last_name: 'Ferrari',   role: 'oarsman',  sweep_side: 'port',       rowing_type: 'sweeping', can_cox: false, weight: 81, init: 'LF', tint: 'water' },
    { id: 6, first_name: 'Iris',     last_name: 'Hansen',    role: 'oarsman',  sweep_side: 'starboard',  rowing_type: 'both',     can_cox: true,  weight: 69, init: 'IH', tint: 'coral' },
    { id: 7, first_name: 'Niko',     last_name: 'Lindqvist', role: 'oarsman',  sweep_side: 'port',       rowing_type: 'both',     can_cox: false, weight: 86, init: 'NL', tint: 'water' },
    { id: 8, first_name: 'Eva',      last_name: 'Novak',     role: 'oarsman',  sweep_side: 'starboard',  rowing_type: 'sweeping', can_cox: false, weight: 73, init: 'EN', tint: 'coral' },
    { id: 9, first_name: 'Pia',      last_name: 'Müller',    role: 'coxswain', sweep_side: 'both',       rowing_type: '',         can_cox: true,  weight: 52, init: 'PM', tint: 'lime' },
    { id: 10, first_name: 'Jonas',   last_name: 'Weber',     role: 'oarsman',  sweep_side: 'port',       rowing_type: 'sculling', can_cox: false, weight: 79, init: 'JW', tint: 'water' },
    { id: 11, first_name: 'Hana',    last_name: 'Park',      role: 'oarsman',  sweep_side: 'starboard',  rowing_type: 'both',     can_cox: false, weight: 70, init: 'HP', tint: 'coral' },
    { id: 12, first_name: 'Coach Ben', last_name: 'Albright', role: 'coach',  sweep_side: '',           rowing_type: '',         can_cox: false, weight: 0,  init: 'BA', tint: 'lime' },
  ];

  // The current user when in 'rower' mode
  const ME_ROWER = TEAM.find(u => u.id === 1);
  const ME_COACH = TEAM.find(u => u.id === 12);

  // Helpers
  const today = new Date('2026-05-17T08:00:00'); // pinned for deterministic visuals
  const monday = (d) => {
    const x = new Date(d);
    const day = x.getDay();
    const diff = x.getDate() - day + (day === 0 ? -6 : 1);
    x.setDate(diff); x.setHours(0,0,0,0); return x;
  };
  const fmt = (d) => d.toISOString().split('T')[0];

  const WEEK_START = monday(today);

  // Availability for current rower (Alex Kovač) this week
  // day_of_week 0=Mon ... 6=Sun ; times in 24h "HH:MM"
  const MY_AVAIL = [
    { id: 1, day: 0, start: '06:00', end: '08:00' },
    { id: 2, day: 0, start: '17:30', end: '19:30' },
    { id: 3, day: 1, start: '06:00', end: '07:30' },
    { id: 4, day: 2, start: '06:00', end: '08:00' },
    { id: 5, day: 2, start: '18:00', end: '20:00' },
    { id: 6, day: 3, start: '06:00', end: '07:30' },
    { id: 7, day: 5, start: '08:00', end: '11:00' },
    { id: 8, day: 6, start: '09:00', end: '11:00' },
  ];

  // Team heatmap (how many teammates are free in this slot)
  // Encoded as ranges per day -> count
  const TEAM_HEATMAP = [
    { day: 0, start: '06:00', end: '08:00', count: 9 },
    { day: 0, start: '17:30', end: '19:30', count: 7 },
    { day: 1, start: '06:00', end: '07:30', count: 8 },
    { day: 2, start: '06:00', end: '08:00', count: 10 },
    { day: 2, start: '18:00', end: '20:00', count: 6 },
    { day: 3, start: '06:00', end: '07:30', count: 9 },
    { day: 4, start: '06:00', end: '07:30', count: 7 },
    { day: 5, start: '08:00', end: '11:00', count: 11 },
    { day: 6, start: '09:00', end: '11:00', count: 8 },
  ];

  // Scheduled sessions this week (for coach + rower views)
  const SESSIONS = [
    {
      id: 101,
      date: '2026-05-18', day: 0,
      start: '06:00', end: '07:30',
      title: 'Steady State',
      description: '6×8 min @ rate 20 — long steady, focus on length and timing.',
      crews: [
        {
          id: 1001, boat_type: '8+', status: 'confirmed',
          seats: [
            { num: 1, rower: 1, side: 'port' },
            { num: 2, rower: 2, side: 'starboard' },
            { num: 3, rower: 3, side: 'port' },
            { num: 4, rower: 4, side: 'starboard' },
            { num: 5, rower: 5, side: 'port' },
            { num: 6, rower: 6, side: 'starboard' },
            { num: 7, rower: 7, side: 'port' },
            { num: 8, rower: 8, side: 'starboard' },
            { num: 0, rower: 9, side: 'cox', is_cox: true },
          ],
        },
      ],
    },
    {
      id: 102,
      date: '2026-05-19', day: 1,
      start: '06:00', end: '07:00',
      title: 'Sprint Pieces',
      description: '8×500 m race-pace, rate 32-36. Race start practice.',
      crews: [
        {
          id: 1002, boat_type: '4+', status: 'confirmed',
          seats: [
            { num: 1, rower: 4, side: 'starboard' },
            { num: 2, rower: 5, side: 'port' },
            { num: 3, rower: 6, side: 'starboard' },
            { num: 4, rower: 1, side: 'port' },
            { num: 0, rower: 9, side: 'cox', is_cox: true },
          ],
        },
        {
          id: 1003, boat_type: '4x', status: 'draft',
          seats: [
            { num: 1, rower: 10, side: 'port' },
            { num: 2, rower: 11, side: 'starboard' },
            { num: 3, rower: 8, side: 'starboard' },
            { num: 4, rower: 3, side: 'port' },
          ],
        },
      ],
    },
    {
      id: 103,
      date: '2026-05-20', day: 2,
      start: '06:00', end: '08:00',
      title: 'Long row',
      description: '90 min UT2. Mixed crews, focus on water feel.',
      crews: [],
    },
    {
      id: 104,
      date: '2026-05-23', day: 5,
      start: '08:00', end: '11:00',
      title: 'Regatta sim',
      description: '2×2000 m at race pace. Full warm-up, full cool-down.',
      crews: [
        {
          id: 1004, boat_type: '8+', status: 'draft',
          seats: [
            { num: 1, rower: 1, side: 'port' },
            { num: 2, rower: 4, side: 'starboard' },
            { num: 3, rower: 3, side: 'port' },
            { num: 4, rower: 6, side: 'starboard' },
            { num: 5, rower: 5, side: 'port' },
            { num: 6, rower: 8, side: 'starboard' },
            { num: 7, rower: 7, side: 'port' },
            { num: 8, rower: 2, side: 'starboard' },
            { num: 0, rower: 9, side: 'cox', is_cox: true },
          ],
        },
      ],
    },
  ];

  // Suggestions for the currently open session (we'll just show for session 103)
  const SUGGESTIONS_BY_SESSION = {
    103: [
      {
        id: 's1', boat_type: '8+', score: 94,
        notes: 'Balanced port/starboard, full preferred pairings.',
        rowers: [
          { id: 1, pos: 'Bow' }, { id: 4, pos: '2' }, { id: 3, pos: '3' }, { id: 6, pos: '4' },
          { id: 5, pos: '5' }, { id: 2, pos: '6' }, { id: 7, pos: '7' }, { id: 8, pos: 'Stroke' },
        ],
      },
      {
        id: 's2', boat_type: '4+', score: 88,
        notes: 'Top-weighted boat, paired strokes.',
        rowers: [
          { id: 1, pos: 'Bow' }, { id: 4, pos: '2' }, { id: 5, pos: '3' }, { id: 8, pos: 'Stroke' },
        ],
      },
      {
        id: 's3', boat_type: '4x', score: 82,
        notes: 'Scullers only.',
        rowers: [
          { id: 10, pos: 'Bow' }, { id: 11, pos: '2' }, { id: 3, pos: '3' }, { id: 7, pos: 'Stroke' },
        ],
      },
      {
        id: 's4', boat_type: '2-', score: 76,
        notes: 'Pair — both novice-friendly.',
        rowers: [{ id: 5, pos: 'Bow' }, { id: 6, pos: 'Stroke' }],
      },
      {
        id: 's5', boat_type: '2x', score: 71,
        notes: 'Double scull.',
        rowers: [{ id: 10, pos: 'Bow' }, { id: 11, pos: 'Stroke' }],
      },
    ],
    102: [
      {
        id: 's6', boat_type: '4+', score: 91,
        notes: 'Fastest available 4 with cox.',
        rowers: [
          { id: 4, pos: 'Bow' }, { id: 5, pos: '2' }, { id: 6, pos: '3' }, { id: 1, pos: 'Stroke' },
        ],
      },
      {
        id: 's7', boat_type: '4x', score: 84,
        notes: 'Mixed scull lineup.',
        rowers: [
          { id: 10, pos: 'Bow' }, { id: 11, pos: '2' }, { id: 8, pos: '3' }, { id: 3, pos: 'Stroke' },
        ],
      },
    ],
  };

  const TEMPLATES = [
    { id: 't1', name: 'Race VIII',         boat_type: '8+', lineup: [8, 2, 6, 5, 4, 3, 1, 7], cox: 9,    note: 'Primary race lineup. Use unless someone is out.' },
    { id: 't2', name: 'Training VIII A',   boat_type: '8+', lineup: [2, 8, 5, 6, 1, 4, 3, 7], cox: 9,    note: 'Rotational training crew, swaps weekly.' },
    { id: 't3', name: 'Lightweight 4+',    boat_type: '4+', lineup: [6, 1, 4, 5],             cox: 9,    note: 'Under-75kg focused, sprint pieces.' },
    { id: 't4', name: 'Top Quad',          boat_type: '4x', lineup: [11, 8, 10, 3],           cox: null, note: 'Scullers-only; best 4x lineup.' },
  ];

  const BOAT_TYPES = [
    { value: '1x', label: '1× Single',     seats: 1, coxed: false },
    { value: '2x', label: '2× Double',     seats: 2, coxed: false },
    { value: '2-', label: '2− Pair',       seats: 2, coxed: false },
    { value: '4x', label: '4× Quad',       seats: 4, coxed: false },
    { value: '4-', label: '4− Four',       seats: 4, coxed: false },
    { value: '4+', label: '4+ Coxed Four', seats: 4, coxed: true },
    { value: '8+', label: '8+ Eight',      seats: 8, coxed: true },
  ];

  const DAY_LABELS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const DAY_LABELS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function findUser(id) { return TEAM.find(u => u.id === id); }

  return {
    TEAM, MY_AVAIL, TEAM_HEATMAP, SESSIONS, SUGGESTIONS_BY_SESSION,
    TEMPLATES,
    BOAT_TYPES, DAY_LABELS, DAY_LABELS_SHORT, MONTHS,
    ME_ROWER, ME_COACH,
    today, WEEK_START, monday, fmt, findUser,
  };
})();
