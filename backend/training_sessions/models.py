from django.db import models
from django.conf import settings


class Session(models.Model):
    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_sessions')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.team.name} - {self.date} {self.start_time}-{self.end_time}"


class CrewAssignment(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='crews')
    boat_type = models.CharField(max_length=5)
    is_confirmed = models.BooleanField(default=False)
    is_cancelled = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.boat_type} - {'Confirmed' if self.is_confirmed else 'Draft'}"


class CrewSeat(models.Model):
    crew = models.ForeignKey(CrewAssignment, on_delete=models.CASCADE, related_name='seats')
    rower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='crew_seats')
    seat_number = models.IntegerField()
    is_cox = models.BooleanField(default=False)

    class Meta:
        unique_together = ['crew', 'seat_number']

    def __str__(self):
        pos = "Cox" if self.is_cox else f"Seat {self.seat_number}"
        return f"{self.rower.email} - {pos}"
