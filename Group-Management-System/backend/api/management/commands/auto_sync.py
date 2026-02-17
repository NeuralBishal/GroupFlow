from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Student, User
import requests
import pandas as pd
from io import StringIO
import schedule
import time
import threading

class Command(BaseCommand):
    help = 'Automatically sync Google Sheets every hour'
    
    def handle(self, *args, **options):
        self.stdout.write('🟢 Starting auto-sync service...')
        
        def sync_job():
            self.stdout.write(f"\n🔄 Auto-sync running at {timezone.now()}")
            sheet_id = '1WqCpSjIiu-_N2qsVpi9WUcFjLDsmyK5Tbps81_DWQTI'
            
            try:
                url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv'
                response = requests.get(url)
                data = pd.read_csv(StringIO(response.text))
                
                created = 0
                updated = 0
                
                for _, row in data.iterrows():
                    name = str(row.iloc[0]).strip()
                    roll = str(row.iloc[1]).strip()
                    
                    student = Student.objects.filter(roll_number=roll).first()
                    
                    if student:
                        if student.name != name:
                            student.name = name
                            student.save()
                            updated += 1
                    else:
                        user = User.objects.create_user(
                            username=roll,
                            password=roll,
                            roll_number=roll,
                            role='student'
                        )
                        Student.objects.create(
                            user=user,
                            roll_number=roll,
                            name=name,
                            email=f"{roll}@college.edu",
                            is_verified=True
                        )
                        created += 1
                
                self.stdout.write(f"✅ Synced: {created} new, {updated} updated")
                
            except Exception as e:
                self.stdout.write(f"❌ Error: {e}")
        
        # Run every hour
        schedule.every(1).hours.do(sync_job)
        
        # Run immediately on start
        sync_job()
        
        # Keep running
        while True:
            schedule.run_pending()
            time.sleep(60)