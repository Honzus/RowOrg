from itertools import combinations
from users.models import User
from availability.models import Availability
from preferences.models import CoachPreference, PreferredPairing
from training_sessions.models import CrewSeat

BOAT_TYPES = {
    '1x': {'seats': 1, 'sculling': True, 'coxed': False},
    '2x': {'seats': 2, 'sculling': True, 'coxed': False},
    '2-': {'seats': 2, 'sculling': False, 'coxed': False},
    '4x': {'seats': 4, 'sculling': True, 'coxed': False},
    '4-': {'seats': 4, 'sculling': False, 'coxed': False},
    '4+': {'seats': 4, 'sculling': False, 'coxed': True},
    '8+': {'seats': 8, 'sculling': False, 'coxed': True},
}


def get_available_rowers(session):
    """Find all team members whose availability overlaps with the session."""
    day_of_week = session.date.weekday()
    availabilities = Availability.objects.filter(
        user__team=session.team,
        week_start__lte=session.date,
        day_of_week=day_of_week,
        start_time__lte=session.start_time,
        end_time__gte=session.end_time,
    )
    user_ids = availabilities.values_list('user_id', flat=True).distinct()
    return User.objects.filter(id__in=user_ids).exclude(role='coach')


def get_already_assigned_rower_ids(session):
    """Get IDs of rowers already assigned to non-cancelled crews in this session."""
    return set(
        CrewSeat.objects.filter(
            crew__session=session,
            crew__is_cancelled=False,
        ).values_list('rower_id', flat=True)
    )


def can_scull(user):
    return user.rowing_type in ('sculling', 'both')


def can_sweep(user):
    return user.rowing_type in ('sweeping', 'both')


def can_row_port(user):
    return user.sweep_side in ('port', 'both')


def can_row_starboard(user):
    return user.sweep_side in ('starboard', 'both')


def is_cox_capable(user):
    return user.role == 'coxswain' or user.can_cox


def _user_to_dict(user):
    return {'id': user.id, 'name': f"{user.first_name} {user.last_name}", 'email': user.email}


def generate_suggestions(session):
    """Generate ranked crew suggestions for a session.

    Excludes rowers already assigned to non-cancelled crews in this session.
    Returns dict with 'suggestions' (rower-only combos) and 'available_coxswains'.
    """
    available = list(get_available_rowers(session))
    if not available:
        return {'suggestions': [], 'available_coxswains': []}

    # Exclude rowers already in active crews for this session
    assigned_ids = get_already_assigned_rower_ids(session)
    available = [u for u in available if u.id not in assigned_ids]

    if not available:
        return {'suggestions': [], 'available_coxswains': []}

    scullers = [u for u in available if can_scull(u)]
    sweepers = [u for u in available if can_sweep(u)]
    coxswains = [u for u in available if is_cox_capable(u)]

    # Also include coxswains who are assigned as rowers but could still cox
    # (dedicated coxswains not yet assigned)
    all_available_for_cox = list(get_available_rowers(session))
    all_coxswains = [u for u in all_available_for_cox if is_cox_capable(u)]
    # Cox can be assigned to multiple boats or not yet assigned
    unassigned_coxswains = [u for u in all_coxswains if u.id not in assigned_ids]

    coach_prefs = list(CoachPreference.objects.filter(
        coach__team=session.team, coach__role='coach'
    ))
    pairings = list(PreferredPairing.objects.filter(
        coach__team=session.team
    ).prefetch_related('rowers'))

    suggestions = []

    for boat_type, spec in BOAT_TYPES.items():
        boat_suggestions = _generate_for_boat_type(
            boat_type, spec, scullers, sweepers, coxswains,
            coach_prefs, pairings
        )
        suggestions.extend(boat_suggestions)

    suggestions.sort(key=lambda s: s['score'], reverse=True)

    return {
        'suggestions': suggestions,
        'available_coxswains': [_user_to_dict(c) for c in unassigned_coxswains],
    }


def _generate_for_boat_type(boat_type, spec, scullers, sweepers, coxswains, coach_prefs, pairings):
    seats = spec['seats']
    is_sculling = spec['sculling']
    is_coxed = spec['coxed']

    eligible = scullers if is_sculling else sweepers

    if len(eligible) < seats:
        return []

    # For coxed boats, still need at least one cox available
    if is_coxed and not coxswains:
        return []

    results = []
    seen = set()  # track unique combos by frozenset of IDs
    max_combos = 50
    combo_count = 0

    for combo in combinations(eligible, seats):
        if combo_count >= max_combos:
            break

        # Deduplicate: same set of rowers = same suggestion
        combo_key = frozenset(u.id for u in combo)
        if combo_key in seen:
            continue
        seen.add(combo_key)

        if not is_sculling:
            if not _validate_sides(combo, seats):
                continue

        combo_count += 1

        score = _score_combination(combo, boat_type, coach_prefs, pairings)

        results.append({
            'boat_type': boat_type,
            'rowers': [_user_to_dict(u) for u in combo],
            'score': score,
        })

    results.sort(key=lambda r: r['score'], reverse=True)
    return results[:5]


def _validate_sides(rowers, seats):
    """Check if a sweep crew can fill port/starboard correctly."""
    port_needed = seats // 2
    starboard_needed = seats - port_needed

    port_only = [r for r in rowers if r.sweep_side == 'port']
    starboard_only = [r for r in rowers if r.sweep_side == 'starboard']
    both_side = [r for r in rowers if r.sweep_side == 'both']

    if len(port_only) > port_needed or len(starboard_only) > starboard_needed:
        return False

    remaining_port = port_needed - len(port_only)
    remaining_starboard = starboard_needed - len(starboard_only)

    return len(both_side) >= remaining_port + remaining_starboard


def _score_combination(rowers, boat_type, coach_prefs, pairings):
    """Score a crew combination based on coach preferences."""
    score = 0
    rower_ids = {r.id for r in rowers}

    for pref in coach_prefs:
        if pref.rower_id in rower_ids:
            if pref.preferred_boat_type == boat_type:
                score += 10 * pref.priority

    for pairing in pairings:
        pairing_rower_ids = set(pairing.rowers.values_list('id', flat=True))
        if pairing_rower_ids.issubset(rower_ids):
            if not pairing.boat_type or pairing.boat_type == boat_type:
                score += 20

    for rower in rowers:
        if rower.sweep_side in ('port', 'starboard'):
            score += 2

    return score
