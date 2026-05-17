from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        COACH = 'coach', 'Coach'
        OARSMAN = 'oarsman', 'Oarsman'
        COXSWAIN = 'coxswain', 'Coxswain'

    class RowingType(models.TextChoices):
        SCULLING = 'sculling', 'Sculling'
        SWEEPING = 'sweeping', 'Sweeping'
        BOTH = 'both', 'Both'

    class SweepSide(models.TextChoices):
        PORT = 'port', 'Port'
        STARBOARD = 'starboard', 'Starboard'
        BOTH = 'both', 'Both'

    email = models.EmailField(unique=True)
    team = models.ForeignKey(
        'teams.Team', on_delete=models.SET_NULL, null=True, blank=True, related_name='members'
    )
    role = models.CharField(max_length=10, choices=Role.choices, blank=True)
    rowing_type = models.CharField(max_length=10, choices=RowingType.choices, blank=True)
    sweep_side = models.CharField(max_length=10, choices=SweepSide.choices, blank=True)
    can_cox = models.BooleanField(default=False)
    weight = models.FloatField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
