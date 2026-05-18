from django.db import models
from django.conf import settings


class CoachPreference(models.Model):
    coach = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coach_preferences')
    rower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='preferences_about')
    preferred_boat_type = models.CharField(max_length=5, blank=True)
    preferred_seat = models.IntegerField(null=True, blank=True)
    priority = models.IntegerField(default=0)

    class Meta:
        unique_together = ['coach', 'rower']

    def __str__(self):
        return f"{self.coach.email} -> {self.rower.email}: {self.preferred_boat_type}"


class PreferredPairing(models.Model):
    coach = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='preferred_pairings')
    rowers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='in_pairings')
    boat_type = models.CharField(max_length=5, blank=True)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"Pairing by {self.coach.email} ({self.boat_type or 'any'})"


class LineupTemplate(models.Model):
    BOAT_TYPES = [
        ('1x', '1× Single'),
        ('2x', '2× Double'),
        ('2-', '2− Pair'),
        ('4x', '4× Quad'),
        ('4-', '4− Four'),
        ('4+', '4+ Coxed four'),
        ('8+', '8+ Eight'),
    ]

    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name='lineup_templates')
    name = models.CharField(max_length=80)
    boat_type = models.CharField(max_length=4, choices=BOAT_TYPES)
    note = models.TextField(blank=True, default='')
    cox = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='cox_in_templates',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.team.name} · {self.name} ({self.boat_type})'


class LineupTemplateSeat(models.Model):
    """One seat in a template, ordered stroke (position=0) -> bow (position=N-1)."""
    template = models.ForeignKey(LineupTemplate, on_delete=models.CASCADE, related_name='seats')
    position = models.PositiveSmallIntegerField()
    rower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='template_seats')

    class Meta:
        unique_together = [('template', 'position')]
        ordering = ['position']

    def __str__(self):
        return f'{self.template.name} pos {self.position} → {self.rower.email}'
