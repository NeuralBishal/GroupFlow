from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix superuser for production'

    def handle(self, *args, **options):
        username = 'BishalMajumdar'
        password = 'Dbrx1366'
        email = 'bishal@groupflow.com'
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_superuser': True,
                'is_staff': True,
                'is_active': True,
                'role': 'super_admin'
            }
        )
        
        user.set_password(password)
        user.save()
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Superuser "{username}" created with password: {password}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'✅ Password reset for "{username}" to: {password}'))
