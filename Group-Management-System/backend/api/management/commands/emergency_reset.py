from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User, RecoveryLog
import getpass
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Emergency account recovery for super admins'
    
    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, required=True)
        parser.add_argument('--reason', type=str, required=True)
        
    def handle(self, *args, **options):
        username = options['username']
        reason = options['reason']
        
        self.stdout.write(self.style.WARNING(f"\n⚠️  EMERGENCY RECOVERY INITIATED"))
        self.stdout.write(f"Target User: {username}")
        self.stdout.write(f"Reason: {reason}")
        self.stdout.write("\n⚠️  THIS ACTION WILL BE LOGGED PERMANENTLY")
        
        # Require physical confirmation
        confirm = input("Type 'EMERGENCY-RECOVER' to proceed: ")
        
        if confirm != 'EMERGENCY-RECOVER':
            self.stdout.write(self.style.ERROR("Recovery cancelled"))
            return
            
        try:
            user = User.objects.get(username=username)
            
            # Log the recovery
            RecoveryLog.objects.create(
                user=user,
                method='super_admin',
                success=True,
                metadata={
                    'reason': reason,
                    'performed_by': getpass.getuser(),
                    'timestamp': str(timezone.now())
                }
            )
            
            # Reset account
            user.recovery_status = 'recovery'
            user.is_frozen = False
            user.freeze_reason = ''
            user.frozen_by = None
            user.frozen_at = None
            user.two_factor_enabled = False
            user.set_unusable_password()
            user.save()
            
            # Generate temporary password
            temp_password = User.objects.make_random_password(length=16)
            user.set_password(temp_password)
            user.save()
            
            self.stdout.write(self.style.SUCCESS(f"\n✅ Account recovered successfully!"))
            self.stdout.write(f"Temporary Password: {temp_password}")
            self.stdout.write(self.style.WARNING("\n⚠️  User must change password on next login"))
            
            # Send notifications
            # (Implement email/SMS notifications here)
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User '{username}' not found"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))