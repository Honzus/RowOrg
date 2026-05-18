from django.contrib import admin
from .models import Regatta


@admin.register(Regatta)
class RegattaAdmin(admin.ModelAdmin):
    list_display = ['name', 'team', 'date', 'location', 'registered', 'crews_entered']
    list_filter = ['team', 'registered']
    search_fields = ['name', 'location', 'team__name']
