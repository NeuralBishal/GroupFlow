from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Reset superuser password'

    def handle(self, *args, **options):
        username = os.environ.get('SUPERUSER_USERNAME', 'BishalMajumdar')
        new_password = os.environ.get('SUPERUSER_NEW_PASSWORD')
        
        if not new_password:
            self.stdout.write(self.style.ERROR('Please set SUPERUSER_NEW_PASSWORD environment variable'))
            return
        
        try:
            user = User.objects.get(username=username)
            user.set_password(new_password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Password reset successfully for {username}'))
            self.stdout.write(self.style.SUCCESS(f'New password: {new_password}'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} not found'))
