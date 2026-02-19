from django.db import migrations

def create_superuser(apps, schema_editor):
    User = apps.get_model('api', 'User')
    
    # Check if user already exists in production
    if not User.objects.filter(username='BishalMajumdar').exists():
        User.objects.create(
            username='BishalMajumdar',
            email='bishal@groupflow.com',
            password='pbkdf2_sha256$600000$7f76hj2Lr8Mfjt5d4275JV$sBQPDGX0jiBAZO8gWar6q6RLQ2csKW0AvxrC/PVBz8g=',
            is_superuser=True,
            is_staff=True,
            is_active=True,
            role='super_admin'
        )
        print("✅ Superuser 'BishalMajumdar' created successfully in production!")
    else:
        print("ℹ️ Superuser 'BishalMajumdar' already exists, skipping...")

def reverse_migration(apps, schema_editor):
    User = apps.get_model('api', 'User')
    User.objects.filter(username='BishalMajumdar').delete()
    print("🗑️ Superuser 'BishalMajumdar' removed.")

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0007_alter_groupselection_options_and_more'),  # This should match your last migration
    ]

    operations = [
        migrations.RunPython(create_superuser, reverse_migration),
    ]

