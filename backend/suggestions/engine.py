from itertools import combinations
from users.models import User
from availability.models import Availability
from preferences.models import CoachPreference, PreferredPairing, LineupTemplate
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

    Template-sourced suggestions (full or partial) come first, scored by % of seats filled
    from current availability. Constraint-based combinations are appended.
    """
    available = list(get_available_rowers(session))
    if not available:
        return {'suggestions': [], 'available_coxswains': []}

    assigned_ids = get_already_assigned_rower_ids(session)
    available_unassigned = [u for u in available if u.id not in assigned_ids]

    if not available_unassigned:
        return {'suggestions': [], 'available_coxswains': []}

    scullers = [u for u in available_unassigned if can_scull(u)]
    sweepers = [u for u in available_unassigned if can_sweep(u)]
    coxswains_unassigned = [u for u in available_unassigned if is_cox_capable(u)]

    all_coxswains = [u for u in available if is_cox_capable(u)]
    unassigned_coxswains = [u for u in all_coxswains if u.id not in assigned_ids]

    coach_prefs = list(CoachPreference.objects.filter(
        coach__team=session.team, coach__role='coach'
    ))
    pairings = list(PreferredPairing.objects.filter(
        coach__team=session.team
    ).prefetch_related('rowers'))

    template_suggestions = _generate_from_templates(session, available_unassigned)

    combo_suggestions = []
    seen = set()
    for s in template_suggestions:
        key = frozenset(r['id'] for r in s['rowers'])
        seen.add((s['boat_type'], key))

    for boat_type, spec in BOAT_TYPES.items():
        for sug in _generate_for_boat_type(
            boat_type, spec, scullers, sweepers, coxswains_unassigned,
            coach_prefs, pairings,
        ):
            key = frozenset(r['id'] for r in sug['rowers'])
            if (boat_type, key) in seen:
                continue
            seen.add((boat_type, key))
            sug['source'] = 'constraint'
            combo_suggestions.append(sug)

    suggestions = template_suggestions + combo_suggestions
    suggestions.sort(key=lambda s: s['score'], reverse=True)

    return {
        'suggestions': suggestions,
        'available_coxswains': [_user_to_dict(c) for c in unassigned_coxswains],
    }


def _generate_from_templates(session, available_pool):
    """For each team template, produce a template-sourced suggestion scored by availability fit."""
    available_ids = {u.id for u in available_pool}
    user_by_id = {u.id: u for u in available_pool}

    results = []
    templates = (
        LineupTemplate.objects
        .filter(team=session.team)
        .prefetch_related('seats__rower')
    )

    for tpl in templates:
        seats = list(tpl.seats.all())
        if not seats:
            continue
        total = len(seats)
        rowers = []
        missing = []
        for seat in seats:
            if seat.rower_id in available_ids:
                rowers.append(user_by_id[seat.rower_id])
            else:
                missing.append(seat.rower_id)

        present_count = len(rowers)
        if present_count == 0:
            continue

        score = int(100 * present_count / total)

        results.append({
            'boat_type': tpl.boat_type,
            'rowers': [_user_to_dict(u) for u in rowers],
            'score': score,
            'source': 'template',
            'template_id': tpl.id,
            'template_name': tpl.name,
            'missing_from_template': missing,
        })

    return results


def _generate_for_boat_type(boat_type, spec, scullers, sweepers, coxswains, coach_prefs, pairings):
    seats = spec['seats']
    is_sculling = spec['sculling']
    is_coxed = spec['coxed']

    eligible = scullers if is_sculling else sweepers

    if len(eligible) < seats:
        return []

    if is_coxed and not coxswains:
        return []

    results = []
    seen = set()
    max_combos = 50
    combo_count = 0

    for combo in combinations(eligible, seats):
        if combo_count >= max_combos:
            break
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
