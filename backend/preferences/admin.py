from django.contrib import admin
from .models import CoachPreference, PreferredPairing, LineupTemplate, LineupTemplateSeat


@admin.register(CoachPreference)
class CoachPreferenceAdmin(admin.ModelAdmin):
    list_display = ['coach', 'rower', 'preferred_boat_type', 'preferred_seat', 'priority']
    list_filter = ['preferred_boat_type']


@admin.register(PreferredPairing)
class PreferredPairingAdmin(admin.ModelAdmin):
    list_display = ['coach', 'boat_type']
    filter_horizontal = ['rowers']


class LineupTemplateSeatInline(admin.TabularInline):
    model = LineupTemplateSeat
    extra = 0


@admin.register(LineupTemplate)
class LineupTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'team', 'boat_type', 'created_by', 'created_at']
    list_filter = ['team', 'boat_type']
    search_fields = ['name', 'team__name']
    inlines = [LineupTemplateSeatInline]


@admin.register(LineupTemplateSeat)
class LineupTemplateSeatAdmin(admin.ModelAdmin):
    list_display = ['template', 'position', 'rower']
    list_filter = ['template__team']
