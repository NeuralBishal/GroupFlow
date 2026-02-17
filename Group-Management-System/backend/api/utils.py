import os
import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build
from django.conf import settings
from .models import Student, User
import logging

logger = logging.getLogger(__name__)

class GoogleSheetsHelper:
    def __init__(self):
        self.SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
        self.SPREADSHEET_ID = settings.GOOGLE_SHEET_ID
        self.RANGE_NAME = 'Sheet1!A:B'  # Assuming columns: Roll Number, Name
        
    def get_credentials(self):
        """Get credentials from service account file"""
        try:
            credentials = service_account.Credentials.from_service_account_file(
                settings.GOOGLE_SHEETS_CREDENTIALS_PATH, scopes=self.SCOPES)
            return credentials
        except Exception as e:
            logger.error(f"Error getting credentials: {e}")
            return None
    
    def fetch_students_from_sheet(self):
        """Fetch students data from Google Sheets"""
        try:
            credentials = self.get_credentials()
            if not credentials:
                return None
            
            service = build('sheets', 'v4', credentials=credentials)
            sheet = service.spreadsheets()
            result = sheet.values().get(spreadsheetId=self.SPREADSHEET_ID,
                                       range=self.RANGE_NAME).execute()
            values = result.get('values', [])
            
            if not values:
                logger.info('No data found in sheet')
                return []
            
            # Convert to list of dictionaries
            students = []
            for row in values[1:]:  # Skip header row
                if len(row) >= 2:
                    students.append({
                        'roll_number': row[0].strip(),
                        'name': row[1].strip()
                    })
            
            return students
        except Exception as e:
            logger.error(f"Error fetching from Google Sheets: {e}")
            return None
    
    def sync_students_to_db(self):
        """Sync students from Google Sheets to database"""
        students_data = self.fetch_students_from_sheet()
        if not students_data:
            return False
        
        synced_count = 0
        for student_data in students_data:
            try:
                # Check if student already exists
                student, created = Student.objects.get_or_create(
                    roll_number=student_data['roll_number'],
                    defaults={
                        'name': student_data['name'],
                        'email': f"{student_data['roll_number']}@college.edu"
                    }
                )
                
                # Create or update user
                user, user_created = User.objects.get_or_create(
                    username=student_data['roll_number'],
                    defaults={
                        'roll_number': student_data['roll_number'],
                        'role': 'student'
                    }
                )
                
                if created:
                    synced_count += 1
                    
            except Exception as e:
                logger.error(f"Error syncing student {student_data['roll_number']}: {e}")
        
        logger.info(f"Synced {synced_count} new students from Google Sheets")
        return True

def verify_student(roll_number, name):
    """Verify if a student exists in the database with matching name"""
    try:
        student = Student.objects.get(roll_number=roll_number)
        return student.name.lower() == name.lower()
    except Student.DoesNotExist:
        return False