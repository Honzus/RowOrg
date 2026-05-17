from datetime import date, time, timedelta
from django.core.management.base import BaseCommand
from users.models import User
from teams.models import Team
from availability.models import Availability
from training_sessions.models import Session
from preferences.models import CoachPreference, PreferredPairing


PASSWORD = 'row123456'


class Command(BaseCommand):
    help = 'Seed database with demo data for smoke testing'

    def handle(self, *args, **options):
        # Clear existing demo data
        User.objects.filter(email__endswith='@demo.com').delete()
        Team.objects.filter(name='Demo Rowing Club').delete()

        # Create team
        team = Team(name='Demo Rowing Club')
        team.save()
        self.stdout.write(f'Created team: {team.name} (invite code: {team.invite_code})')

        # Create users
        users_data = [
            {'email': 'coach@demo.com', 'username': 'coach', 'first_name': 'Coach', 'last_name': 'Smith', 'role': 'coach', 'rowing_type': '', 'sweep_side': '', 'can_cox': False},
            {'email': 'alice@demo.com', 'username': 'alice', 'first_name': 'Alice', 'last_name': 'Johnson', 'role': 'oarsman', 'rowing_type': 'sweeping', 'sweep_side': 'port', 'can_cox': False},
            {'email': 'bob@demo.com', 'username': 'bob', 'first_name': 'Bob', 'last_name': 'Williams', 'role': 'oarsman', 'rowing_type': 'sweeping', 'sweep_side': 'starboard', 'can_cox': False},
            {'email': 'carol@demo.com', 'username': 'carol', 'first_name': 'Carol', 'last_name': 'Brown', 'role': 'oarsman', 'rowing_type': 'sweeping', 'sweep_side': 'both', 'can_cox': False},
            {'email': 'dan@demo.com', 'username': 'dan', 'first_name': 'Dan', 'last_name': 'Davis', 'role': 'oarsman', 'rowing_type': 'both', 'sweep_side': 'starboard', 'can_cox': True},
            {'email': 'eve@demo.com', 'username': 'eve', 'first_name': 'Eve', 'last_name': 'Miller', 'role': 'oarsman', 'rowing_type': 'sculling', 'sweep_side': '', 'can_cox': False},
            {'email': 'frank@demo.com', 'username': 'frank', 'first_name': 'Frank', 'last_name': 'Wilson', 'role': 'oarsman', 'rowing_type': 'sweeping', 'sweep_side': 'port', 'can_cox': False},
            {'email': 'grace@demo.com', 'username': 'grace', 'first_name': 'Grace', 'last_name': 'Moore', 'role': 'oarsman', 'rowing_type': 'sweeping', 'sweep_side': 'starboard', 'can_cox': False},
            {'email': 'henry@demo.com', 'username': 'henry', 'first_name': 'Henry', 'last_name': 'Taylor', 'role': 'oarsman', 'rowing_type': 'sweeping', 'sweep_side': 'port', 'can_cox': False},
            {'email': 'ivy@demo.com', 'username': 'ivy', 'first_name': 'Ivy', 'last_name': 'Anderson', 'role': 'coxswain', 'rowing_type': '', 'sweep_side': '', 'can_cox': True},
        ]

        created_users = {}
        for u in users_data:
            user = User.objects.create_user(
                email=u['email'],
                username=u['username'],
                password=PASSWORD,
                first_name=u['first_name'],
                last_name=u['last_name'],
                team=team,
                role=u['role'],
                rowing_type=u['rowing_type'],
                sweep_side=u['sweep_side'],
                can_cox=u['can_cox'],
            )
            created_users[u['username']] = user

        self.stdout.write(f'Created {len(created_users)} users (password for all: {PASSWORD})')

        # Create availability: all rowers available Mon-Fri this week
        today = date.today()
        monday = today - timedelta(days=today.weekday())
        rowers = [u for u in created_users.values() if u.role != 'coach']

        for rower in rowers:
            for day in range(5):  # Mon-Fri
                Availability.objects.create(
                    user=rower,
                    week_start=monday,
                    day_of_week=day,
                    start_time=time(6, 0),
                    end_time=time(20, 0),
                )

        self.stdout.write(f'Created availability for {len(rowers)} rowers (Mon-Fri, 06:00-20:00)')

        # Create a practice session for tomorrow
        tomorrow = today + timedelta(days=1)
        # If tomorrow is weekend, use next Monday
        if tomorrow.weekday() >= 5:
            tomorrow = tomorrow + timedelta(days=(7 - tomorrow.weekday()))

        session = Session.objects.create(
            team=team,
            date=tomorrow,
            start_time=time(14, 0),
            end_time=time(17, 0),
            description='4x1000m at rate 28, 2x500m sprint finish',
            created_by=created_users['coach'],
        )
        self.stdout.write(f'Created session: {session.date} 14:00-17:00')

        # Coach preferences: Alice + Bob preferred pairing for 4+
        coach = created_users['coach']
        alice = created_users['alice']
        bob = created_users['bob']

        CoachPreference.objects.create(coach=coach, rower=alice, preferred_boat_type='4+', priority=5)
        CoachPreference.objects.create(coach=coach, rower=bob, preferred_boat_type='4+', priority=5)

        pairing = PreferredPairing.objects.create(coach=coach, boat_type='4+', note='Good chemistry')
        pairing.rowers.add(alice, bob)

        self.stdout.write('Created coach preferences (Alice + Bob pairing for 4+)')
        self.stdout.write(self.style.SUCCESS('\nDone! Login with any @demo.com email and password: row123456'))
