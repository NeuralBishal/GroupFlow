from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login as auth_login, logout
from django.db import transaction
from django.db.models import F
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import logging
import os
import json
import secrets
import string
import subprocess
import shutil
from datetime import datetime
import pyotp
import pandas as pd
import requests
from io import StringIO

from webauthn import (
    generate_registration_options, 
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response
)
from webauthn.helpers.structs import (
    RegistrationCredential,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
)

from .models import *
from .serializers import *
from .utils import GoogleSheetsHelper, verify_student
from .otp_utils import generate_otp, send_otp_email, send_otp_sms

logger = logging.getLogger(__name__)

# ==================== AUTHENTICATION VIEWS ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Handle user login"""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        auth_login(request, user)
        
        is_first_login = (username == password)
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'is_group_leader': user.is_group_leader,
                'roll_number': user.roll_number,
                'is_first_login': is_first_login
            }
        })
    else:
        return Response({
            'success': False,
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout_view(request):
    """Handle user logout"""
    logout(request)
    return Response({'success': True, 'message': 'Logged out successfully'})


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Handle new user registration"""
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        roll_number = request.data.get('roll_number')
        name = request.data.get('name')
        email = request.data.get('email')
        phone = request.data.get('phone')
        
        if not all([username, password, roll_number, name]):
            return Response({
                'success': False,
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({
                'success': False,
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if Student.objects.filter(roll_number=roll_number).exists():
            return Response({
                'success': False,
                'error': 'Roll number already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            username=username,
            password=password,
            roll_number=roll_number,
            role='student',
            email=email,
            phone_number=phone
        )
        
        student = Student.objects.create(
            user=user,
            roll_number=roll_number,
            name=name,
            email=email or f"{roll_number}@college.edu",
            phone=phone,
            is_verified=True
        )
        
        auth_login(request, user)
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'is_group_leader': user.is_group_leader,
                'roll_number': user.roll_number
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Send password reset email"""
    try:
        username_or_email = request.data.get('username_or_email')
        
        user = None
        if '@' in username_or_email:
            try:
                student = Student.objects.get(email=username_or_email)
                user = student.user
            except Student.DoesNotExist:
                try:
                    faculty = Faculty.objects.get(email=username_or_email)
                    user = faculty.user
                except Faculty.DoesNotExist:
                    pass
        else:
            try:
                user = User.objects.get(username=username_or_email)
            except User.DoesNotExist:
                pass
        
        if not user:
            return Response({
                'success': False,
                'error': 'No user found with this username/email'
            }, status=status.HTTP_404_NOT_FOUND)
        
        token = default_token_generator.make_token(user)
        reset_link = f"http://localhost:3000/reset-password/{user.id}/{token}"
        
        print(f"\n=== PASSWORD RESET LINK ===\n{reset_link}\n==========================\n")
        
        return Response({
            'success': True,
            'message': 'If an account exists, a reset link has been sent'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password using token"""
    try:
        user_id = request.data.get('user_id')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if new_password != confirm_password:
            return Response({
                'success': False,
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_password(new_password)
        except ValidationError as e:
            return Response({
                'success': False,
                'error': list(e.messages)[0]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Invalid user'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if not default_token_generator.check_token(user, token):
            return Response({
                'success': False,
                'error': 'Invalid or expired reset link'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Password reset successful. You can now login.'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_reset_token(request, user_id, token):
    """Verify if reset token is valid"""
    try:
        user = User.objects.get(id=user_id)
        if default_token_generator.check_token(user, token):
            return Response({'valid': True})
        return Response({'valid': False}, status=status.HTTP_400_BAD_REQUEST)
    except:
        return Response({'valid': False}, status=status.HTTP_400_BAD_REQUEST)


# ==================== GOOGLE SHEETS IMPORT ====================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_students_from_sheet(request):
    """Import students from public Google Sheet CSV"""
    
    sheet_id = request.data.get('sheet_id')
    if not sheet_id:
        return Response({'error': 'Sheet ID required'}, status=400)
    
    print(f"\n🟢 IMPORT VIEW CALLED with Sheet ID: {sheet_id}")
    
    try:
        url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv'
        response = requests.get(url)
        response.raise_for_status()
        
        data = pd.read_csv(StringIO(response.text))
        print(f"📊 Found {len(data)} rows in sheet")
        
        imported = 0
        updated = 0
        
        for index, row in data.iterrows():
            name = str(row.iloc[0]).strip()
            roll = str(row.iloc[1]).strip()
            
            print(f"  Processing: {name} - {roll}")
            
            if Student.objects.filter(roll_number=roll).exists():
                # Update existing
                student = Student.objects.get(roll_number=roll)
                student.name = name
                student.save()
                updated += 1
                print(f"    🔄 Updated: {roll}")
            else:
                # Create new
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
                imported += 1
                print(f"    ✅ Created: {roll}")
        
        return Response({
            'success': True,
            'message': f'✅ Imported: {imported}, Updated: {updated}',
            'total': len(data),
            'imported': imported,
            'updated': updated
        })
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return Response({'error': str(e)}, status=500)
# ==================== SYNC GOOGLE SHEETS ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def sync_google_sheets(request):
    """Sync students from Google Sheets"""
    helper = GoogleSheetsHelper()
    success = helper.sync_students_to_db()
    
    if success:
        return Response({'message': 'Students synced successfully'})
    else:
        return Response({'error': 'Failed to sync students'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== GROUP MANAGEMENT ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    """Create a new group"""
    serializer = CreateGroupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    leader_roll = serializer.validated_data['leader_roll_number']
    group_size = serializer.validated_data['group_size']
    members_data = serializer.validated_data['members']
    
    try:
        leader = Student.objects.get(roll_number=leader_roll)
    except Student.DoesNotExist:
        return Response({'error': 'Group leader not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if GroupMember.objects.filter(student=leader).exists():
        return Response({'error': 'Student is already in a group'}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(members_data) != group_size - 1:
        return Response({'error': f'Group must have {group_size} members total'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    members = []
    for member_data in members_data:
        roll = member_data.get('roll_number')
        name = member_data.get('name')
        
        if not verify_student(roll, name):
            return Response({'error': f'Invalid student: {roll}'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            student = Student.objects.get(roll_number=roll)
            if GroupMember.objects.filter(student=student).exists():
                return Response({'error': f'Student {roll} is already in a group'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            members.append(student)
        except Student.DoesNotExist:
            return Response({'error': f'Student {roll} not found'}, 
                           status=status.HTTP_404_NOT_FOUND)
    
    with transaction.atomic():
        group = Group.objects.create(
            group_leader=leader,
            size=group_size
        )
        
        GroupMember.objects.create(group=group, student=leader)
        
        for member in members:
            GroupMember.objects.create(group=group, student=member)
        
        leader_user = User.objects.get(roll_number=leader_roll)
        leader_user.is_group_leader = True
        leader_user.save()
    
    return Response({
        'success': True,
        'group_id': group.group_id,
        'message': 'Group created successfully'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_group_status(request, roll_number):
    """Check if a student is in a group"""
    try:
        student = Student.objects.get(roll_number=roll_number)
        group_member = GroupMember.objects.filter(student=student).first()
        
        if group_member:
            group = group_member.group
            serializer = GroupSerializer(group)
            return Response({
                'in_group': True,
                'group': serializer.data
            })
        else:
            return Response({
                'in_group': False,
                'message': 'Student is not in any group'
            })
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def select_group_preferences(request):
    """Select faculty, domain, and topic for a group"""
    group_id = request.data.get('group_id')
    faculty_id = request.data.get('faculty_id')
    domain_id = request.data.get('domain_id')
    topic_id = request.data.get('topic_id')

    try:
        group = Group.objects.get(group_id=group_id)
        
        if hasattr(group, 'selection'):
            return Response({'error': 'Group already has selections'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        faculty = Faculty.objects.get(id=faculty_id)
        if faculty.current_groups >= faculty.max_groups:
            return Response({'error': 'Faculty has reached maximum groups'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        topic = Topic.objects.get(id=topic_id)
        if topic.current_groups >= topic.max_groups:
            return Response({'error': 'Topic has reached maximum groups'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            selection = GroupSelection.objects.create(
                group=group,
                faculty=faculty,
                domain_id=domain_id,
                topic=topic
            )
            
            faculty.current_groups += 1
            if faculty.current_groups >= faculty.max_groups:
                faculty.is_available = False
            faculty.save()
            
            topic.current_groups += 1
            if topic.current_groups >= topic.max_groups:
                topic.is_available = False
            topic.save()
        
        serializer = GroupSelectionSerializer(selection)
        return Response(serializer.data)
        
    except Group.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)
    except Faculty.DoesNotExist:
        return Response({'error': 'Faculty not found'}, status=status.HTTP_404_NOT_FOUND)
    except Topic.DoesNotExist:
        return Response({'error': 'Topic not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== DATA FETCHING ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_faculty(request):
    """Get available faculty members"""
    faculty = Faculty.objects.filter(is_available=True, current_groups__lt=F('max_groups'))
    serializer = FacultySerializer(faculty, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_domains(request):
    """Get all domains"""
    domains = Domain.objects.all()
    serializer = DomainSerializer(domains, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_topics_by_domain(request, domain_id):
    """Get topics for a specific domain"""
    topics = Topic.objects.filter(domain_id=domain_id, is_available=True)
    serializer = TopicSerializer(topics, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def faculty_dashboard(request, faculty_id):
    """Get groups assigned to a faculty member"""
    try:
        faculty = Faculty.objects.get(id=faculty_id)
        selections = GroupSelection.objects.filter(faculty=faculty)
        serializer = GroupSelectionSerializer(selections, many=True)
        return Response(serializer.data)
    except Faculty.DoesNotExist:
        return Response({'error': 'Faculty not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== ADMIN MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_faculties(request):
    """Get all faculties (for admin)"""
    faculties = Faculty.objects.all()
    serializer = FacultySerializer(faculties, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_faculty(request):
    """Admin creates faculty account"""
    try:
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        faculty_id = request.data.get('faculty_id')
        max_groups = request.data.get('max_groups', 3)
        
        if User.objects.filter(username=faculty_id).exists():
            return Response({
                'success': False,
                'error': 'Faculty ID already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            username=faculty_id,
            password=password,
            faculty_id=faculty_id,
            role='faculty'
        )
        
        faculty = Faculty.objects.create(
            user=user,
            name=name,
            email=email,
            max_groups=max_groups,
            current_groups=0,
            is_available=True
        )
        
        return Response({
            'success': True,
            'faculty': FacultySerializer(faculty).data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_domain(request):
    """Admin creates new domain"""
    try:
        name = request.data.get('name')
        description = request.data.get('description', '')
        
        domain = Domain.objects.create(
            name=name,
            description=description
        )
        
        return Response(DomainSerializer(domain).data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_topic(request, domain_id):
    """Admin creates new topic under domain"""
    try:
        name = request.data.get('name')
        description = request.data.get('description', '')
        max_groups = request.data.get('max_groups', 3)
        
        domain = Domain.objects.get(id=domain_id)
        
        topic = Topic.objects.create(
            name=name,
            domain=domain,
            description=description,
            max_groups=max_groups,
            current_groups=0,
            is_available=True
        )
        
        return Response(TopicSerializer(topic).data, status=status.HTTP_201_CREATED)
        
    except Domain.DoesNotExist:
        return Response({'error': 'Domain not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_domain(request, domain_id):
    """Delete a domain and all its topics"""
    if request.user.role not in ['admin', 'super_admin']:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        domain = Domain.objects.get(id=domain_id)
        domain.delete()
        return Response({'success': True, 'message': 'Domain deleted'})
    except Domain.DoesNotExist:
        return Response({'error': 'Domain not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_topic(request, topic_id):
    """Delete a topic"""
    if request.user.role not in ['admin', 'super_admin']:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        topic = Topic.objects.get(id=topic_id)
        topic.delete()
        return Response({'success': True, 'message': 'Topic deleted'})
    except Topic.DoesNotExist:
        return Response({'error': 'Topic not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== SUPER ADMIN AUTHENTICATION ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def super_admin_login_view(request):
    """Handle super admin login"""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None and user.role == 'super_admin':
        auth_login(request, user)
        
        AdminLoginLog.objects.create(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=True,
            two_factor_used=False
        )
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'is_group_leader': user.is_group_leader,
                'roll_number': user.roll_number
            }
        })
    else:
        AdminLoginLog.objects.create(
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=False
        )
        
        return Response({
            'success': False,
            'error': 'Invalid super admin credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_admin_dashboard_stats(request):
    """Get real statistics for super admin dashboard"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        stats = {
            'totalAdmins': User.objects.filter(role='admin').count(),
            'totalStudents': Student.objects.count(),
            'totalFaculty': Faculty.objects.count(),
            'totalGroups': Group.objects.count(),
            'pendingRecoveries': RecoveryLog.objects.filter(success=False).count(),
            'totalDomains': Domain.objects.count(),
            'totalTopics': Topic.objects.count(),
        }
        return Response(stats)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== BIOMETRIC AUTHENTICATION ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def list_biometrics(request):
    """List registered biometric devices for a user"""
    username = request.GET.get('username')
    
    if username:
        try:
            user = User.objects.get(username=username, role='super_admin')
            biometrics = SuperAdminBiometric.objects.filter(user=user)
            devices = [{
                'id': b.id,
                'device_name': b.device_name,
                'created_at': b.created_at,
                'last_used': b.last_used,
                'username': user.username
            } for b in biometrics]
            return Response({'success': True, 'devices': devices})
        except User.DoesNotExist:
            return Response({'success': True, 'devices': []})
    
    return Response({'success': True, 'devices': []})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_biometric(request):
    """Register biometric for super admin"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Only super admin can register biometric'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        registration_options = generate_registration_options(
            rp_id=request.get_host().split(':')[0],
            rp_name="GroupFlow Super Admin",
            user_id=str(request.user.id).encode(),
            user_name=request.user.username,
            user_display_name=request.user.username,
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=UserVerificationRequirement.REQUIRED,
                authenticator_attachment='platform'
            )
        )
        
        request.session['webauthn_challenge'] = registration_options.challenge
        
        return Response({
            'success': True,
            'options': json.loads(registration_options.json())
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_biometric(request):
    """Verify and store biometric credential"""
    
    try:
        credential = RegistrationCredential(**request.data)
        challenge = request.session.get('webauthn_challenge')
        
        if not challenge:
            return Response({'error': 'No registration in progress'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=request.get_host().split(':')[0],
            expected_origin=f"https://{request.get_host()}"
        )
        
        SuperAdminBiometric.objects.create(
            user=request.user,
            credential_id=verification.credential_id,
            public_key=verification.credential_public_key,
            sign_count=verification.sign_count,
            device_name=request.data.get('device_name', 'Unknown Device')
        )
        
        return Response({'success': True, 'message': 'Biometric registered'})
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def biometric_login(request):
    """Login using biometric"""
    
    try:
        credential = request.data.get('credential')
        credential_id = credential.get('id')
        
        biometric = SuperAdminBiometric.objects.get(credential_id=credential_id)
        user = biometric.user
        
        auth_options = generate_authentication_options(
            rp_id=request.get_host().split(':')[0],
            allow_credentials=[credential_id]
        )
        
        request.session['webauthn_challenge'] = auth_options.challenge
        
        return Response({
            'success': True,
            'options': json.loads(auth_options.json()),
            'user_id': user.id
        })
        
    except SuperAdminBiometric.DoesNotExist:
        return Response({'error': 'Biometric not registered'}, 
                       status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_biometric_login(request):
    """Verify biometric login"""
    
    try:
        credential = request.data.get('credential')
        user_id = request.data.get('user_id')
        
        user = User.objects.get(id=user_id)
        biometric = SuperAdminBiometric.objects.get(user=user)
        
        challenge = request.session.get('webauthn_challenge')
        
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_rp_id=request.get_host().split(':')[0],
            expected_origin=f"https://{request.get_host()}",
            credential_public_key=biometric.public_key,
            credential_current_sign_count=biometric.sign_count
        )
        
        biometric.sign_count = verification.new_sign_count
        biometric.last_used = timezone.now()
        biometric.save()
        
        auth_login(request, user)
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)


# ==================== PAPER KEYS MANAGEMENT ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_paper_keys(request):
    """Get all paper keys for the super admin"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        keys = EmergencyPaperKey.objects.filter(user=request.user).order_by('-created_at')
        keys_data = [{
            'id': key.id,
            'key_hint': key.key_hint,
            'created_at': key.created_at,
            'used_at': key.used_at
        } for key in keys]
        
        return Response({'success': True, 'keys': keys_data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_paper_keys(request):
    """Generate emergency paper backup keys"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    keys = []
    for i in range(5):
        alphabet = string.ascii_letters + string.digits + '!@#$%'
        key = ''.join(secrets.choice(alphabet) for _ in range(16))
        formatted_key = '-'.join([key[i:i+4] for i in range(0, 16, 4)])
        
        paper_key = EmergencyPaperKey.objects.create(
            user=request.user,
            key_hash=make_password(key),
            key_hint=f"Key #{i+1} - {timezone.now().strftime('%Y-%m-%d')}"
        )
        
        keys.append({
            'id': paper_key.id,
            'key': formatted_key,
            'hint': f"Key #{i+1}"
        })
    
    return Response({
        'success': True,
        'message': 'Print these keys and store in a physical safe',
        'keys': keys
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_paper_key(request, key_id):
    """Delete a specific paper key"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        key = EmergencyPaperKey.objects.get(id=key_id, user=request.user)
        key.delete()
        return Response({'success': True, 'message': 'Key deleted successfully'})
    except EmergencyPaperKey.DoesNotExist:
        return Response({'error': 'Key not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def emergency_paper_recovery(request):
    """Recover super admin account using paper key"""
    
    username = request.data.get('username')
    paper_key = request.data.get('paper_key').replace('-', '')
    
    try:
        user = User.objects.get(username=username, role='super_admin')
        
        paper_key_obj = EmergencyPaperKey.objects.filter(
            user=user, 
            used_at__isnull=True
        ).first()
        
        if not paper_key_obj:
            return Response({'error': 'No valid paper keys remaining'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        if paper_key_obj.verify_key(paper_key):
            paper_key_obj.used_at = timezone.now()
            paper_key_obj.save()
            
            temp_password = User.objects.make_random_password(length=16)
            user.set_password(temp_password)
            user.save()
            
            RecoveryLog.objects.create(
                user=user,
                method='paper_key',
                success=True,
                metadata={'key_hint': paper_key_obj.key_hint}
            )
            
            return Response({
                'success': True,
                'temp_password': temp_password,
                'message': 'Emergency recovery successful. Login and set new password immediately.'
            })
        else:
            return Response({'error': 'Invalid paper key'}, 
                           status=status.HTTP_401_UNAUTHORIZED)
            
    except User.DoesNotExist:
        return Response({'error': 'Super admin not found'}, 
                       status=status.HTTP_404_NOT_FOUND)


# ==================== ANALYTICS AND SETTINGS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def super_admin_analytics(request):
    """Get comprehensive analytics for super admin"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        end_date = timezone.now()
        start_date = end_date - timezone.timedelta(days=7)
        
        daily_activity = []
        for i in range(7):
            day = end_date - timezone.timedelta(days=i)
            next_day = day + timezone.timedelta(days=1)
            
            logins = AdminLoginLog.objects.filter(
                timestamp__gte=day,
                timestamp__lt=next_day
            ).count()
            
            groups = Group.objects.filter(
                created_at__gte=day,
                created_at__lt=next_day
            ).count()
            
            selections = GroupSelection.objects.filter(
                selected_at__gte=day,
                selected_at__lt=next_day
            ).count()
            
            daily_activity.append({
                'date': day.date(),
                'logins': logins,
                'groupCreations': groups,
                'selections': selections,
                'total': logins + groups + selections
            })
        
        analytics = {
            'users': {
                'total': User.objects.count(),
                'students': Student.objects.count(),
                'faculty': Faculty.objects.count(),
                'admins': User.objects.filter(role='admin').count(),
                'superAdmins': User.objects.filter(role='super_admin').count()
            },
            'groups': {
                'total': Group.objects.count(),
                'active': Group.objects.filter(is_complete=False).count(),
                'completed': Group.objects.filter(is_complete=True).count(),
                'twoMember': Group.objects.filter(size=2).count(),
                'fourMember': Group.objects.filter(size=4).count()
            },
            'domains': {
                'total': Domain.objects.count(),
                'topics': Topic.objects.count()
            },
            'selections': {
                'total': GroupSelection.objects.count(),
                'approved': GroupSelection.objects.filter(is_approved=True).count(),
                'pending': GroupSelection.objects.filter(is_approved=False).count()
            },
            'activity': {
                'last7Days': daily_activity,
                'totalLogins': AdminLoginLog.objects.filter(success=True).count(),
                'totalActions': Group.objects.count() + GroupSelection.objects.count()
            }
        }
        
        return Response(analytics)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def super_admin_settings(request):
    """Get or update system settings"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    default_settings = {
        'general': {
            'siteName': 'GroupFlow',
            'siteUrl': 'http://localhost:3000',
            'adminEmail': 'admin@groupflow.com',
            'timezone': 'Asia/Kolkata',
            'dateFormat': 'YYYY-MM-DD',
            'timeFormat': '24h'
        },
        'security': {
            'sessionTimeout': 30,
            'maxLoginAttempts': 5,
            'lockoutDuration': 15,
            'passwordMinLength': 8,
            'passwordRequireUppercase': True,
            'passwordRequireLowercase': True,
            'passwordRequireNumbers': True,
            'passwordRequireSpecial': True,
            'twoFactorRequired': False,
            'sessionPerUser': True,
            'ipWhitelist': []
        },
        'email': {
            'smtpHost': 'smtp.gmail.com',
            'smtpPort': 587,
            'smtpUser': 'noreply@groupflow.com',
            'smtpPassword': '',
            'useTLS': True,
            'fromEmail': 'noreply@groupflow.com',
            'fromName': 'GroupFlow System'
        },
        'features': {
            'allowStudentRegistration': True,
            'allowFacultyRegistration': False,
            'requireEmailVerification': True,
            'requirePhoneVerification': False,
            'maxGroupSize': 4,
            'minGroupSize': 2,
            'allowTopicSelection': True,
            'maxGroupsPerTopic': 3,
            'maxGroupsPerFaculty': 3
        },
        'backup': {
            'autoBackup': True,
            'backupFrequency': 'daily',
            'backupTime': '02:00',
            'retentionDays': 30,
            'lastBackup': None
        },
        'notifications': {
            'emailNotifications': True,
            'smsNotifications': False,
            'adminAlerts': True,
            'securityAlerts': True,
            'backupAlerts': True,
            'dailyDigest': False
        }
    }
    
    if request.method == 'GET':
        try:
            settings_file = os.path.join(settings.BASE_DIR, 'system_settings.json')
            if os.path.exists(settings_file):
                with open(settings_file, 'r') as f:
                    saved_settings = json.load(f)
                return Response(saved_settings)
            else:
                return Response(default_settings)
        except Exception as e:
            return Response(default_settings)
    
    elif request.method == 'POST':
        try:
            new_settings = request.data
            
            required_sections = ['general', 'security', 'email', 'features', 'backup', 'notifications']
            for section in required_sections:
                if section not in new_settings:
                    return Response({
                        'success': False,
                        'error': f'Missing {section} settings'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            settings_file = os.path.join(settings.BASE_DIR, 'system_settings.json')
            with open(settings_file, 'w') as f:
                json.dump(new_settings, f, indent=2)
            
            RecoveryLog.objects.create(
                user=request.user,
                method='settings_update',
                success=True,
                metadata={'action': 'Settings updated'}
            )
            
            return Response({
                'success': True,
                'message': 'Settings saved successfully'
            })
            
        except Exception as e:
            RecoveryLog.objects.create(
                user=request.user,
                method='settings_update',
                success=False,
                metadata={'error': str(e)}
            )
            
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def super_admin_settings_reset(request):
    """Reset settings to defaults"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    default_settings = {
        'general': {
            'siteName': 'GroupFlow',
            'siteUrl': 'http://localhost:3000',
            'adminEmail': 'admin@groupflow.com',
            'timezone': 'Asia/Kolkata',
            'dateFormat': 'YYYY-MM-DD',
            'timeFormat': '24h'
        },
        'security': {
            'sessionTimeout': 30,
            'maxLoginAttempts': 5,
            'lockoutDuration': 15,
            'passwordMinLength': 8,
            'passwordRequireUppercase': True,
            'passwordRequireLowercase': True,
            'passwordRequireNumbers': True,
            'passwordRequireSpecial': True,
            'twoFactorRequired': False,
            'sessionPerUser': True,
            'ipWhitelist': []
        },
        'email': {
            'smtpHost': 'smtp.gmail.com',
            'smtpPort': 587,
            'smtpUser': 'noreply@groupflow.com',
            'smtpPassword': '',
            'useTLS': True,
            'fromEmail': 'noreply@groupflow.com',
            'fromName': 'GroupFlow System'
        },
        'features': {
            'allowStudentRegistration': True,
            'allowFacultyRegistration': False,
            'requireEmailVerification': True,
            'requirePhoneVerification': False,
            'maxGroupSize': 4,
            'minGroupSize': 2,
            'allowTopicSelection': True,
            'maxGroupsPerTopic': 3,
            'maxGroupsPerFaculty': 3
        },
        'backup': {
            'autoBackup': True,
            'backupFrequency': 'daily',
            'backupTime': '02:00',
            'retentionDays': 30,
            'lastBackup': None
        },
        'notifications': {
            'emailNotifications': True,
            'smsNotifications': False,
            'adminAlerts': True,
            'securityAlerts': True,
            'backupAlerts': True,
            'dailyDigest': False
        }
    }
    
    try:
        settings_file = os.path.join(settings.BASE_DIR, 'system_settings.json')
        with open(settings_file, 'w') as f:
            json.dump(default_settings, f, indent=2)
        
        RecoveryLog.objects.create(
            user=request.user,
            method='settings_reset',
            success=True
        )
        
        return Response({
            'success': True,
            'message': 'Settings reset to defaults',
            'settings': default_settings
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_email(request):
    """Test email configuration"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        email_config = request.data
        
        old_settings = {
            'EMAIL_HOST': settings.EMAIL_HOST,
            'EMAIL_PORT': settings.EMAIL_PORT,
            'EMAIL_HOST_USER': settings.EMAIL_HOST_USER,
            'EMAIL_HOST_PASSWORD': settings.EMAIL_HOST_PASSWORD,
            'EMAIL_USE_TLS': settings.EMAIL_USE_TLS,
        }
        
        settings.EMAIL_HOST = email_config.get('smtpHost', settings.EMAIL_HOST)
        settings.EMAIL_PORT = email_config.get('smtpPort', settings.EMAIL_PORT)
        settings.EMAIL_HOST_USER = email_config.get('smtpUser', settings.EMAIL_HOST_USER)
        settings.EMAIL_HOST_PASSWORD = email_config.get('smtpPassword', settings.EMAIL_HOST_PASSWORD)
        settings.EMAIL_USE_TLS = email_config.get('useTLS', settings.EMAIL_USE_TLS)
        
        send_mail(
            'Test Email from GroupFlow',
            f'This is a test email to verify your SMTP configuration.\n\n'
            f'Sent at: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}\n'
            f'If you received this, your email settings are working correctly!',
            email_config.get('fromEmail', settings.DEFAULT_FROM_EMAIL),
            [request.user.email],
            fail_silently=False,
        )
        
        for key, value in old_settings.items():
            setattr(settings, key, value)
        
        RecoveryLog.objects.create(
            user=request.user,
            method='test_email',
            success=True
        )
        
        return Response({
            'success': True,
            'message': f'Test email sent to {request.user.email}'
        })
        
    except Exception as e:
        RecoveryLog.objects.create(
            user=request.user,
            method='test_email',
            success=False,
            metadata={'error': str(e)}
        )
        
        return Response({
            'success': False,
            'error': f'Email test failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manual_backup(request):
    """Perform manual system backup"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        db_settings = settings.DATABASES['default']
        db_engine = db_settings['ENGINE']
        
        backup_info = {
            'timestamp': timestamp,
            'type': 'manual',
            'files': []
        }
        
        if 'sqlite' in db_engine:
            db_path = db_settings['NAME']
            backup_file = os.path.join(backup_dir, f'db_backup_{timestamp}.sqlite3')
            shutil.copy2(db_path, backup_file)
            backup_info['files'].append({
                'type': 'database',
                'file': f'db_backup_{timestamp}.sqlite3',
                'size': os.path.getsize(backup_file)
            })
            
        elif 'postgresql' in db_engine:
            backup_file = os.path.join(backup_dir, f'db_backup_{timestamp}.sql')
            db_name = db_settings['NAME']
            db_user = db_settings['USER']
            db_host = db_settings.get('HOST', 'localhost')
            db_port = db_settings.get('PORT', '5432')
            
            cmd = f"pg_dump -h {db_host} -p {db_port} -U {db_user} -d {db_name} > {backup_file}"
            subprocess.run(cmd, shell=True, check=True)
            backup_info['files'].append({
                'type': 'database',
                'file': f'db_backup_{timestamp}.sql',
                'size': os.path.getsize(backup_file) if os.path.exists(backup_file) else 0
            })
        
        if hasattr(settings, 'MEDIA_ROOT') and os.path.exists(settings.MEDIA_ROOT):
            media_backup = os.path.join(backup_dir, f'media_backup_{timestamp}.zip')
            shutil.make_archive(media_backup.replace('.zip', ''), 'zip', settings.MEDIA_ROOT)
            backup_info['files'].append({
                'type': 'media',
                'file': f'media_backup_{timestamp}.zip',
                'size': os.path.getsize(media_backup) if os.path.exists(media_backup) else 0
            })
        
        info_file = os.path.join(backup_dir, f'backup_{timestamp}.json')
        with open(info_file, 'w') as f:
            json.dump(backup_info, f, indent=2)
        
        settings_file = os.path.join(settings.BASE_DIR, 'system_settings.json')
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                current_settings = json.load(f)
            if 'backup' not in current_settings:
                current_settings['backup'] = {}
            current_settings['backup']['lastBackup'] = timestamp
            with open(settings_file, 'w') as f:
                json.dump(current_settings, f, indent=2)
        
        RecoveryLog.objects.create(
            user=request.user,
            method='manual_backup',
            success=True,
            metadata=backup_info
        )
        
        return Response({
            'success': True,
            'message': 'Backup completed successfully',
            'backup': backup_info
        })
        
    except Exception as e:
        RecoveryLog.objects.create(
            user=request.user,
            method='manual_backup',
            success=False,
            metadata={'error': str(e)}
        )
        
        return Response({
            'success': False,
            'error': f'Backup failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== OTP VERIFICATION ====================

def verify_otp_helper(secret, otp):
    """Verify OTP code against user's secret"""
    if not secret or not otp:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(otp)


# ==================== ADMIN LOGIN WITH 2FA ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login_view(request):
    """Enhanced admin login with 2FA and security features"""
    
    username = request.data.get('username')
    password = request.data.get('password')
    otp = request.data.get('otp')
    
    ip = request.META.get('REMOTE_ADDR')
    recent_attempts = AdminLoginLog.objects.filter(
        ip_address=ip,
        timestamp__gte=timezone.now() - timezone.timedelta(minutes=15)
    ).count()
    
    if recent_attempts > 10:
        return Response({
            'success': False,
            'error': 'Too many attempts. Try again later.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    user = authenticate(request, username=username, password=password)
    
    if user and user.role == 'admin':
        if user.two_factor_enabled:
            if not verify_otp_helper(user.totp_secret, otp):
                AdminLoginLog.objects.create(
                    user=user,
                    ip_address=ip,
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    success=False
                )
                return Response({
                    'success': False,
                    'error': 'Invalid 2FA code'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        AdminLoginLog.objects.create(
            user=user,
            ip_address=ip,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=True,
            two_factor_used=user.two_factor_enabled
        )
        
        auth_login(request, user)
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'two_factor_enabled': user.two_factor_enabled
            }
        })
    
    AdminLoginLog.objects.create(
        ip_address=ip,
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        success=False
    )
    
    return Response({
        'success': False,
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)


# ==================== SUPER ADMIN CREATE ADMIN ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def super_admin_create_admin(request):
    """Super admin creates a new admin account"""
    
    if request.user.role != 'super_admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        name = request.data.get('name')
        
        if not all([username, password, email, name]):
            return Response({
                'success': False,
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({
                'success': False,
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        admin_user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role='admin'
        )
        
        RecoveryLog.objects.create(
            user=request.user,
            method='create_admin',
            success=True,
            metadata={'new_admin': username}
        )
        
        return Response({
            'success': True,
            'message': f'Admin {username} created successfully'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

# ==================== CHANGE PASSWORD ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    new_password = request.data.get('new_password')
    
    if not new_password:
        return Response({'error': 'New password required'}, status=400)
    
    try:
        validate_password(new_password)
    except ValidationError as e:
        return Response({'error': list(e.messages)[0]}, status=400)
    
    request.user.set_password(new_password)
    request.user.save()
    
    return Response({'success': True, 'message': 'Password changed successfully'})


# ==================== PASSWORD RESET WITH OTP ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Request password reset via email or phone"""
    
    identifier = request.data.get('identifier')
    method = request.data.get('method', 'email')
    
    if not identifier:
        return Response({'error': 'Email or phone number required'}, status=400)
    
    user = None
    if '@' in identifier:
        try:
            user = User.objects.get(email=identifier)
        except User.DoesNotExist:
            try:
                user = User.objects.get(recovery_email=identifier)
            except User.DoesNotExist:
                pass
    else:
        try:
            user = User.objects.get(phone_number=identifier)
        except User.DoesNotExist:
            try:
                user = User.objects.get(recovery_phone=identifier)
            except User.DoesNotExist:
                pass
    
    if not user:
        return Response({
            'success': True,
            'message': 'If an account exists, instructions will be sent'
        })
    
    otp = generate_otp()
    user.otp_secret = otp
    user.otp_created_at = timezone.now()
    user.save()
    
    if method == 'email':
        send_otp_email(identifier, otp, user.role)
    else:
        send_otp_sms(identifier, otp)
    
    return Response({
        'success': True,
        'message': f'OTP sent to your {method}',
        'user_id': user.id
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_otp(request):
    """Verify OTP and allow password reset"""
    
    user_id = request.data.get('user_id')
    otp = request.data.get('otp')
    
    if not user_id or not otp:
        return Response({'error': 'User ID and OTP required'}, status=400)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if user.otp_secret == otp and user.otp_created_at and (timezone.now() - user.otp_created_at).seconds < 600:
        token = default_token_generator.make_token(user)
        return Response({
            'success': True,
            'message': 'OTP verified',
            'token': token,
            'user_id': user.id
        })
    else:
        return Response({'error': 'Invalid or expired OTP'}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_with_otp(request):
    """Reset password using verified OTP"""
    
    user_id = request.data.get('user_id')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if new_password != confirm_password:
        return Response({'error': 'Passwords do not match'}, status=400)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Invalid or expired token'}, status=400)
    
    try:
        validate_password(new_password)
    except ValidationError as e:
        return Response({'error': list(e.messages)[0]}, status=400)
    
    user.set_password(new_password)
    user.otp_secret = ''
    user.save()
    
    return Response({'success': True, 'message': 'Password reset successful'})
