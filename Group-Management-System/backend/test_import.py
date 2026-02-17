import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'group_management.settings')
django.setup()

from api.models import Student, User
import requests
import pandas as pd
from io import StringIO

def test_import():
    sheet_id = '1WqCpSjIiu-_N2qsVpi9WUcFjLDsmyK5Tbps81_DWQTI'
    
    print(f"\n🔍 Testing import from sheet: {sheet_id}")
    print(f"Students before: {Student.objects.count()}")
    
    # Fetch sheet
    url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv'
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch: {response.status_code}")
        return
    
    data = pd.read_csv(StringIO(response.text))
    print(f"📊 Found {len(data)} rows")
    print(f"Columns: {data.columns.tolist()}")
    print("\nFirst 3 rows:")
    print(data.head(3))
    
    # Import
    imported = 0
    updated = 0
    
    for idx, row in data.iterrows():
        name = str(row.iloc[0]).strip()
        roll = str(row.iloc[1]).strip()
        
        print(f"\nRow {idx+1}: {name} - {roll}")
        
        if Student.objects.filter(roll_number=roll).exists():
            student = Student.objects.get(roll_number=roll)
            student.name = name
            student.save()
            updated += 1
            print(f"  🔄 Updated existing")
        else:
            # Create user
            user = User.objects.create_user(
                username=roll,
                password=roll,
                roll_number=roll,
                role='student'
            )
            # Create student
            Student.objects.create(
                user=user,
                roll_number=roll,
                name=name,
                email=f"{roll}@college.edu",
                is_verified=True
            )
            imported += 1
            print(f"  ✅ Created new")
    
    print(f"\n📈 Final: Students after: {Student.objects.count()}")
    print(f"✨ New: {imported}, Updated: {updated}")

if __name__ == '__main__':
    test_import()