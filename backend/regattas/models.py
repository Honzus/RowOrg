from django.db import models
from django.conf import settings


class Regatta(models.Model):
    team = models.ForeignKey('teams.Team', on_delete=models.CASCADE, related_name='regattas')
    name = models.CharField(max_length=160)
    date = models.DateField()
    location = models.CharField(max_length=200, blank=True, default='')
    registered = models.BooleanField(default=False)
    crews_entered = models.PositiveSmallIntegerField(default=0)
    note = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_regattas'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f'{self.name} ({self.date})'
