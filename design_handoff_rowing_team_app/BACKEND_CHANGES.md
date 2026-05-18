# Backend Changes

All changes apply to the Django + DRF backend at `backend/` of `Honzus/RowOrg`.

Existing apps: `users`, `teams`, `availability`, `training_sessions`, `preferences`, `suggestions`.

## 1. Lineup Templates (NEW)

A new Django app, or new model inside the existing `preferences` app — recommend **adding to `preferences`** since templates are conceptually a preference about how to build a lineup.

### Model

```python
# backend/preferences/models.py

class LineupTemplate(models.Model):
    BOAT_TYPES = [
        ('1x', '1× Single'),
        ('2x', '2× Double'),
        ('2-', '2− Pair'),
        ('4x', '4× Quad'),
        ('4-', '4− Four'),
        ('4+', '4+ Coxed Four'),
        ('8+', '8+ Eight'),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='lineup_templates')
    name = models.CharField(max_length=80)
    boat_type = models.CharField(max_length=4, choices=BOAT_TYPES)
    note = models.TextField(blank=True, default='')

    # Ordered stroke -> bow. Validated against boat_type's seat count.
    # Cox stored separately so the same template logic supports both coxed and uncoxed.
    cox = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cox_in_templates',
    )

    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.team.name} · {self.name} ({self.boat_type})'


class LineupTemplateSeat(models.Model):
    """One seat in a template, ordered stroke (position=0) -> bow (position=N-1)."""
    template = models.ForeignKey(LineupTemplate, on_delete=models.CASCADE, related_name='seats')
    position = models.PositiveSmallIntegerField()   # 0 = stroke
    rower = models.ForeignKey(User, on_delete=models.PROTECT, related_name='template_seats')

    class Meta:
        unique_together = [('template', 'position')]
        ordering = ['position']
```

### Migrations

Standard `makemigrations preferences && migrate`. Backfill nothing.

### Serializer

```python
# backend/preferences/serializers.py

class LineupTemplateSeatSerializer(serializers.ModelSerializer):
    rower_detail = UserMinimalSerializer(source='rower', read_only=True)

    class Meta:
        model = LineupTemplateSeat
        fields = ['position', 'rower', 'rower_detail']


class LineupTemplateSerializer(serializers.ModelSerializer):
    seats = LineupTemplateSeatSerializer(many=True)
    # Flat helper field — array of rower IDs ordered stroke -> bow
    lineup = serializers.SerializerMethodField()
    cox_detail = UserMinimalSerializer(source='cox', read_only=True)

    class Meta:
        model = LineupTemplate
        fields = [
            'id', 'team', 'name', 'boat_type', 'note',
            'cox', 'cox_detail', 'lineup', 'seats',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['team', 'created_by', 'created_at', 'updated_at']

    def get_lineup(self, obj):
        return [s.rower_id for s in obj.seats.all()]

    def validate(self, data):
        # The frontend can send seats as nested objects OR as a flat `lineup` list.
        # Accept both — convert flat list to seats payload if present.
        request = self.context['request']
        lineup = request.data.get('lineup')
        if lineup is not None:
            data['seats'] = [
                {'position': i, 'rower_id': rid} for i, rid in enumerate(lineup)
            ]
        # Verify seat count matches boat_type.
        BOAT_SEATS = {'1x': 1, '2x': 2, '2-': 2, '4x': 4, '4-': 4, '4+': 4, '8+': 8}
        expected = BOAT_SEATS.get(data.get('boat_type') or self.instance.boat_type)
        if data.get('seats') and len(data['seats']) != expected:
            raise serializers.ValidationError(
                f'Boat type {data.get("boat_type")} needs {expected} rower seats; got {len(data["seats"])}.'
            )
        return data

    def create(self, validated_data):
        seats_data = validated_data.pop('seats', [])
        request = self.context['request']
        template = LineupTemplate.objects.create(
            team=request.user.team,
            created_by=request.user,
            **validated_data,
        )
        for seat in seats_data:
            LineupTemplateSeat.objects.create(template=template, **seat)
        return template

    def update(self, instance, validated_data):
        seats_data = validated_data.pop('seats', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if seats_data is not None:
            instance.seats.all().delete()
            for seat in seats_data:
                LineupTemplateSeat.objects.create(template=instance, **seat)
        return instance
```

### Views

```python
# backend/preferences/views.py

class LineupTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = LineupTemplateSerializer
    permission_classes = [IsAuthenticated, IsTeamMember]

    def get_queryset(self):
        return LineupTemplate.objects.filter(team=self.request.user.team).prefetch_related('seats__rower')

    def perform_create(self, serializer):
        # `team` and `created_by` are set inside serializer.create
        serializer.save()
```

Permission: only coaches (`request.user.role == 'coach'`) can mutate. All team members can list/retrieve (so the suggestion engine can read them, and rowers can see what templates they're in).

### URLs

```python
# backend/preferences/urls.py
router.register(r'templates', LineupTemplateViewSet, basename='templates')
```

### Suggestion engine integration

The existing engine in `backend/suggestions/` should be updated to:

1. **Read team templates.** Before scoring random combinations, evaluate each matching-boat-type template's lineup with current availability:
   - If every templated rower is available at the session time → produces a perfect-fit suggestion with score 100, labeled `source: 'template'`, e.g. *"Race VIII (full)"*.
   - If some rowers are unavailable → produce a *"Race VIII − Alex"* fallback suggestion with the missing seats marked as gaps, scored proportionally to the % filled from template.
2. Existing constraint-based suggestions still run alongside; UI shows both in the same list.

Add a field to the suggestion response:

```python
{
  "boat_type": "8+",
  "score": 94,
  "rowers": [...],
  "source": "template",                  # or "constraint" or "manual"
  "template_id": 1,                      # optional
  "template_name": "Race VIII",          # optional, for display
  "missing_from_template": [3, 7],       # optional, rower IDs not available
}
```

---

## 2. Team Availability Aggregate (NEW)

Endpoint that returns the heatmap data the Plan page needs. **Important**: this must NOT just be 12 individual GETs of `/availability/` — that's a perf trap.

### View

```python
# backend/availability/views.py

class TeamAvailabilityView(APIView):
    permission_classes = [IsAuthenticated, IsTeamMember]

    def get(self, request):
        week_start = request.query_params.get('week_start')
        if not week_start:
            return Response({'error': 'week_start required (YYYY-MM-DD)'}, status=400)

        team_members = User.objects.filter(team=request.user.team).exclude(role='coach')
        member_ids = set(team_members.values_list('id', flat=True))

        # All slots from all members for that week
        slots = Availability.objects.filter(
            user_id__in=member_ids,
            week_start=week_start,
        ).values('day_of_week', 'start_time', 'end_time', 'user_id')

        # Sweep-line: for each day, collect (time, user_id, delta) events
        # then emit contiguous blocks where the set of users is constant.
        from collections import defaultdict
        from datetime import time

        blocks = []
        per_day = defaultdict(list)
        for s in slots:
            per_day[s['day_of_week']].append(s)

        for day, day_slots in per_day.items():
            # Build a list of (minute, +1 or -1, user_id) events
            events = []
            for s in day_slots:
                start_min = s['start_time'].hour * 60 + s['start_time'].minute
                end_min = s['end_time'].hour * 60 + s['end_time'].minute
                events.append((start_min, 'in', s['user_id']))
                events.append((end_min, 'out', s['user_id']))
            events.sort()

            current = set()
            prev_min = None
            for minute, kind, uid in events:
                if prev_min is not None and current and minute != prev_min:
                    blocks.append({
                        'day_of_week': day,
                        'start_time': f'{prev_min // 60:02d}:{prev_min % 60:02d}',
                        'end_time':   f'{minute // 60:02d}:{minute % 60:02d}',
                        'count': len(current),
                        'rower_ids': sorted(current),
                    })
                if kind == 'in':
                    current.add(uid)
                else:
                    current.discard(uid)
                prev_min = minute

        return Response(blocks)
```

### URL

```python
# backend/availability/urls.py
urlpatterns += [
    path('team/', TeamAvailabilityView.as_view(), name='team-availability'),
]
```

Or namespace under planning:
```python
# backend/roworg/urls.py
path('api/planning/team-availability/', TeamAvailabilityView.as_view()),
```

### Caching

For a small team (12 rowers), no caching needed. For 50+, consider:
- Cache key: `team_availability:{team_id}:{week_start}` with 5-min TTL.
- Invalidate on `Availability.save()` / `.delete()` via signal.

---

## 3. Session creation from Plan page

**No backend changes required.** The Plan page uses the existing `POST /training_sessions/` endpoint with the same payload as the current `createSession` API. The Plan page simply pre-fills date / start / end from the dragged range.

---

## 4. Migrations summary

```
python manage.py makemigrations preferences
python manage.py migrate
```

No data migration. Existing data is untouched.

---

## 5. Admin (optional but recommended)

Add to `backend/preferences/admin.py`:

```python
@admin.register(LineupTemplate)
class LineupTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'team', 'boat_type', 'created_by', 'created_at']
    list_filter = ['team', 'boat_type']
    search_fields = ['name', 'team__name']


@admin.register(LineupTemplateSeat)
class LineupTemplateSeatAdmin(admin.ModelAdmin):
    list_display = ['template', 'position', 'rower']
    list_filter = ['template__team']
```

---

## 6. Tests (recommended)

- `LineupTemplate` model: seat count must match boat_type.
- `LineupTemplateSerializer.validate`: flat `lineup` list converts to seats correctly.
- `LineupTemplateViewSet`: rowers can list but not write; coach can write.
- `TeamAvailabilityView`: returns correct counts for overlapping slots from multiple users.
- Suggestion engine: template-sourced suggestions appear first and respect availability.
