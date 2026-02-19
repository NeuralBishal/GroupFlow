from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
import hashlib
import os

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('faculty', 'Faculty'),
        ('admin', 'Admin'),
        ('super_admin', 'Super Admin'),
    )

    RECOVERY_STATUS = (
        ('active', 'Active'),
        ('locked', 'Locked'),
        ('recovery', 'Recovery Mode'),
        ('frozen', 'Frozen - Legal Hold'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    roll_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    faculty_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    is_group_leader = models.BooleanField(default=False)

    # Recovery Fields
    recovery_email = models.EmailField(blank=True, null=True)
    recovery_phone = models.CharField(max_length=15, blank=True, null=True)
    backup_codes = models.JSONField(default=list, blank=True)
    security_question_1 = models.CharField(max_length=200, blank=True)
    security_answer_1 = models.CharField(max_length=200, blank=True)
    security_question_2 = models.CharField(max_length=200, blank=True)
    security_answer_2 = models.CharField(max_length=200, blank=True)
    
    # 2FA Fields
    two_factor_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=100, blank=True)
    
    # Recovery Status
    recovery_status = models.CharField(max_length=20, choices=RECOVERY_STATUS, default='active')
    recovery_attempts = models.IntegerField(default=0)
    last_recovery_attempt = models.DateTimeField(null=True, blank=True)
    
    # Trusted Contacts
    trusted_contacts = models.ManyToManyField('self', symmetrical=False, blank=True)
    
    # Recovery Token
    recovery_token = models.CharField(max_length=100, blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    
    # Audit Fields
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_users')
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    
    # Account Freeze
    is_frozen = models.BooleanField(default=False)
    freeze_reason = models.TextField(blank=True)
    frozen_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='frozen_users')
    frozen_at = models.DateTimeField(null=True, blank=True)
    
    # OTP Fields for Password Reset
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    otp_secret = models.CharField(max_length=100, blank=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    def set_backup_codes(self, codes):
        hashed_codes = []
        for code in codes:
            salt = os.urandom(32).hex()
            hashed = hashlib.pbkdf2_hmac('sha256', code.encode(), salt.encode(), 100000).hex()
            hashed_codes.append(f"{salt}${hashed}")
        self.backup_codes = hashed_codes
        
    def verify_backup_code(self, code):
        for stored in self.backup_codes:
            salt, hashed = stored.split('$')
            test_hash = hashlib.pbkdf2_hmac('sha256', code.encode(), salt.encode(), 100000).hex()
            if test_hash == hashed:
                self.backup_codes.remove(stored)
                self.save()
                return True
        return False
    
    def __str__(self):
        return f"{self.username} - {self.role}"


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    roll_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.roll_number})"


class Faculty(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='faculty_profile')
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    max_groups = models.IntegerField(default=3)
    current_groups = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name


class Group(models.Model):
    GROUP_SIZE_CHOICES = (
        (2, '2 Members'),
        (4, '4 Members'),
    )
    
    group_id = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    group_leader = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='led_groups')
    size = models.IntegerField(choices=GROUP_SIZE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    is_complete = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Group {self.group_id}"


class GroupMember(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['group', 'student']


class Domain(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name


class Topic(models.Model):
    name = models.CharField(max_length=200)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name='topics')
    description = models.TextField()
    max_groups = models.IntegerField(default=3)
    current_groups = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name


# ✅ SINGLE GroupSelection model with FCFS support
class GroupSelection(models.Model):
    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='selection')
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, related_name='groups')
    domain = models.ForeignKey(Domain, on_delete=models.SET_NULL, null=True)
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True)
    selected_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)
    
    # FCFS support with millisecond precision
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['submitted_at']  # Oldest first = FCFS
    
    def __str__(self):
        return f"Selection for Group {self.group.group_id}"


class AdminLoginLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    two_factor_used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']


class RecoveryLog(models.Model):
    RECOVERY_METHODS = (
        ('backup_code', 'Backup Code'),
        ('email', 'Email Verification'),
        ('phone', 'Phone OTP'),
        ('security_questions', 'Security Questions'),
        ('trusted_contact', 'Trusted Contact'),
        ('co_admin', 'Co-Admin Approval'),
        ('super_admin', 'Super Admin Override'),
        ('legal_hold', 'Legal Hold Release'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recovery_logs')
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_recoveries')
    method = models.CharField(max_length=50, choices=RECOVERY_METHODS)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']


class SuperAdminBiometric(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='biometric')
    credential_id = models.CharField(max_length=500, unique=True)
    public_key = models.TextField()
    sign_count = models.IntegerField(default=0)
    device_name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-last_used']


class EmergencyPaperKey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='paper_keys')
    key_hash = models.CharField(max_length=200)
    key_hint = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    
    def verify_key(self, key):
        return check_password(key, self.key_hash)
    

class TempStudent(models.Model):
    roll_number = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    imported = models.BooleanField(default=False)
    imported_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.roll_number})"


class SelectionQueue(models.Model):
    """Tracks pending selections for FCFS"""
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, null=True, blank=True)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, null=True, blank=True)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, null=True, blank=True)
    requested_at = models.DateTimeField(auto_now_add=True, db_index=True)
    processed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['requested_at']