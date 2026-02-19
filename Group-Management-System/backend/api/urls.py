from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('verify-reset-token/<int:user_id>/<str:token>/', views.verify_reset_token, name='verify_reset_token'),
    
    # Google Sheets
    path('sync-google-sheets/', views.sync_google_sheets, name='sync_google_sheets'),
    
    # Group Management
    path('create-group/', views.create_group, name='create_group'),
    path('check-group-status/<str:roll_number>/', views.check_group_status, name='check_group_status'),
    path('get-student-name/<str:roll_number>/', views.get_student_name, name='get_student_name'),
    
    # Data Fetching
    path('available-faculty/', views.get_available_faculty, name='available_faculty'),
    path('domains/', views.get_domains, name='domains'),
    path('topics/<int:domain_id>/', views.get_topics_by_domain, name='topics_by_domain'),
    path('faculty-dashboard/<int:faculty_id>/', views.faculty_dashboard, name='faculty_dashboard'),
    
    # Admin Management
    path('admin/faculties/', views.get_all_faculties, name='admin_faculties'),
    path('admin/create-faculty/', views.admin_create_faculty, name='admin_create_faculty'),
    path('admin/create-domain/', views.admin_create_domain, name='admin_create_domain'),
    path('admin/create-topic/<int:domain_id>/', views.admin_create_topic, name='admin_create_topic'),
    path('admin/delete-domain/<int:domain_id>/', views.admin_delete_domain, name='admin_delete_domain'),
    path('admin/delete-topic/<int:topic_id>/', views.admin_delete_topic, name='admin_delete_topic'),
    path('admin/list/', views.get_admin_list, name='admin_list'),
    path('admin/create-admin/', views.admin_create_admin, name='admin_create_admin'),
    path('admin/all-groups/', views.admin_get_all_groups, name='admin_all_groups'),
    path('admin/all-students/', views.admin_get_all_students, name='admin_all_students'),

    # Admin Profile & Recovery
    path('admin/profile/', views.admin_profile, name='admin_profile'),
    path('admin/forgot-password/', views.admin_forgot_password, name='admin_forgot_password'),
    path('admin/verify-otp/', views.admin_verify_otp, name='admin_verify_otp'),
    path('admin/reset-password/', views.admin_reset_password, name='admin_reset_password'),
    path('admin/faculty-details/', views.admin_get_all_faculty_details, name='admin_faculty_details'),
    
    # Super Admin Authentication
    path('super-admin/login/', views.super_admin_login_view, name='super_admin_login'),
    path('super-admin/dashboard-stats/', views.super_admin_dashboard_stats, name='super_admin_dashboard_stats'),
    path('super-admin/admins/', views.get_all_admins, name='super_admin_admins'),
    
    # Biometric Authentication
    path('super-admin/register-biometric/', views.register_biometric, name='register_biometric'),
    path('super-admin/verify-biometric/', views.verify_biometric, name='verify_biometric'),
    path('super-admin/biometric-login/', views.biometric_login, name='biometric_login'),
    path('super-admin/verify-biometric-login/', views.verify_biometric_login, name='verify_biometric_login'),
    path('super-admin/list-biometrics/', views.list_biometrics, name='list_biometrics'),
    path('super-admin/create-admin/', views.super_admin_create_admin, name='super_admin_create_admin'),

    # Paper Keys Management
    path('super-admin/paper-keys/', views.get_paper_keys, name='get_paper_keys'),
    path('super-admin/generate-paper-keys/', views.generate_paper_keys, name='generate_paper_keys'),
    path('super-admin/paper-key/<int:key_id>/', views.delete_paper_key, name='delete_paper_key'),
    path('super-admin/emergency-paper-recovery/', views.emergency_paper_recovery, name='emergency_paper_recovery'),
    
    # Analytics and Settings
    path('super-admin/analytics/', views.super_admin_analytics, name='super_admin_analytics'),
    path('super-admin/settings/', views.super_admin_settings, name='super_admin_settings'),
    path('super-admin/settings/reset/', views.super_admin_settings_reset, name='super_admin_settings_reset'),
    path('super-admin/test-email/', views.test_email, name='test_email'),
    path('super-admin/backup/', views.manual_backup, name='manual_backup'),

    # Sheets Import
    path('import-students/', views.import_students_from_sheet, name='import_students'),
    path('import-faculty/', views.import_faculty_from_sheet, name='import_faculty'),

    # Password Change
    path('change-password/', views.change_password, name='change_password'),

    # Mobile Authentication 
    path('request-password-reset/', views.request_password_reset, name='request_password_reset'),
    path('verify-reset-otp/', views.verify_reset_otp, name='verify_reset_otp'),
    path('reset-password-with-otp/', views.reset_password_with_otp, name='reset_password_with_otp'),    

    # FCFS System
    path('select-fcfs/', views.select_group_preferences_fcfs, name='select_fcfs'),
    path('selection-queue/', views.get_selection_queue, name='selection_queue'),

    # Faculty Management
    path('faculty/export/', views.export_faculty_to_sheet, name='export_faculty'),
    path('faculty/<int:faculty_id>/domains/', views.get_faculty_domains, name='faculty_domains'),
    path('faculty/assign-domain/', views.assign_domain_to_faculty, name='assign_domain'),
]