from collections import defaultdict

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Availability
from .serializers import AvailabilitySerializer


class AvailabilityListCreateView(generics.ListCreateAPIView):
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        qs = Availability.objects.filter(user=self.request.user)
        week_start = self.request.query_params.get('week_start')
        if week_start:
            qs = qs.filter(week_start=week_start)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AvailabilityDeleteView(generics.DestroyAPIView):
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(user=self.request.user)


class TeamAvailabilityView(APIView):
    """Raw team availability slots, optionally filtered by date or week_start."""

    def get(self, request):
        user = request.user
        if not user.team:
            return Response({'error': 'Not in a team'}, status=400)
        date = request.query_params.get('date')
        week_start = request.query_params.get('week_start')
        qs = Availability.objects.filter(user__team=user.team)
        if week_start:
            qs = qs.filter(week_start=week_start)
        if date:
            from datetime import datetime
            d = datetime.strptime(date, '%Y-%m-%d').date()
            day_of_week = d.weekday()
            qs = qs.filter(day_of_week=day_of_week)
        return Response(AvailabilitySerializer(qs, many=True).data)


class TeamAvailabilityBlocksView(APIView):
    """
    Aggregate team-availability for the Coach Plan heatmap.

    Sweep-line per day → list of contiguous time ranges with count of free rowers + rower_ids.
    Coaches are excluded from the count.
    For larger teams (50+), add Redis caching keyed by (team_id, week_start) with invalidation
    on Availability save/delete signals.
    """

    def get(self, request):
        user = request.user
        if not user.team:
            return Response({'error': 'Not in a team'}, status=400)

        week_start = request.query_params.get('week_start')
        if not week_start:
            return Response({'error': 'week_start required (YYYY-MM-DD)'}, status=400)

        slots = (
            Availability.objects
            .filter(user__team=user.team, week_start=week_start)
            .exclude(user__role='coach')
            .values('day_of_week', 'start_time', 'end_time', 'user_id')
        )

        per_day = defaultdict(list)
        for s in slots:
            per_day[s['day_of_week']].append(s)

        blocks = []
        for day, day_slots in per_day.items():
            events = []
            for s in day_slots:
                start_min = s['start_time'].hour * 60 + s['start_time'].minute
                end_min = s['end_time'].hour * 60 + s['end_time'].minute
                # Order matters: process 'out' events before 'in' at the same minute so that
                # a slot ending at 08:00 and another starting at 08:00 don't briefly double-count.
                events.append((start_min, 1, s['user_id']))
                events.append((end_min, 0, s['user_id']))
            events.sort(key=lambda e: (e[0], e[1]))

            current = set()
            prev_min = None
            for minute, kind, uid in events:
                if prev_min is not None and current and minute != prev_min:
                    blocks.append({
                        'day_of_week': day,
                        'start_time': f'{prev_min // 60:02d}:{prev_min % 60:02d}',
                        'end_time': f'{minute // 60:02d}:{minute % 60:02d}',
                        'count': len(current),
                        'rower_ids': sorted(current),
                    })
                if kind == 1:
                    current.add(uid)
                else:
                    current.discard(uid)
                prev_min = minute

        blocks.sort(key=lambda b: (b['day_of_week'], b['start_time']))
        return Response(blocks)
