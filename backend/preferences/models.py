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
