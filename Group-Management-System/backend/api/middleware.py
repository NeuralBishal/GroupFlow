from django.utils import timezone
from django.contrib.auth import logout
from django.http import JsonResponse
from .models import AdminLoginLog
import hashlib
import hmac

class AdminSecurityMiddleware:
    """
    Middleware for enhanced admin security
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.max_attempts = 5
        self.lockout_time = 30  # minutes
        
    def __call__(self, request):
        # Check if it's an admin endpoint
        if request.path.startswith('/admin/'):
            # Check for brute force attempts
            ip = self.get_client_ip(request)
            
            # Check if IP is locked out
            if self.is_ip_locked(ip):
                return JsonResponse({
                    'error': 'Too many failed attempts. Try again later.'
                }, status=403)
            
            # Add security headers
            response = self.get_response(request)
            response['X-Content-Type-Options'] = 'nosniff'
            response['X-Frame-Options'] = 'DENY'
            response['X-XSS-Protection'] = '1; mode=block'
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            
            return response
        
        return self.get_response(request)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def is_ip_locked(self, ip):
        # Check recent failed attempts
        recent_failures = AdminLoginLog.objects.filter(
            ip_address=ip,
            success=False,
            timestamp__gte=timezone.now() - timezone.timedelta(minutes=self.lockout_time)
        ).count()
        
        return recent_failures >= self.max_attempts