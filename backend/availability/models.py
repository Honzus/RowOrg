from django.db import models
from django.conf import settings


class Availability(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='availabilities')
    week_start = models.DateField()
    day_of_week = models.IntegerField()  # 0=Monday, 6=Sunday
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        verbose_name_plural = 'availabilities'
        unique_together = ['user', 'week_start', 'day_of_week', 'start_time', 'end_time']

    def __str__(self):
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return f"{self.user.email} - {days[self.day_of_week]} {self.start_time}-{self.end_time}"
