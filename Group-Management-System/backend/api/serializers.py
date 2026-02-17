from rest_framework import serializers
from .models import User, Student, Faculty, Group, GroupMember, Domain, Topic, GroupSelection

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'roll_number', 'name', 'email', 'is_verified']

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['id', 'name', 'email', 'max_groups', 'current_groups', 'is_available']

class GroupMemberSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    
    class Meta:
        model = GroupMember
        fields = ['id', 'student', 'student_details', 'joined_at']

class GroupSerializer(serializers.ModelSerializer):
    group_leader_details = StudentSerializer(source='group_leader', read_only=True)
    members = GroupMemberSerializer(source='groupmember_set', many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = ['id', 'group_id', 'group_leader', 'group_leader_details', 'size', 'created_at', 'is_complete', 'members']

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['id', 'name', 'description']

class TopicSerializer(serializers.ModelSerializer):
    domain_name = serializers.CharField(source='domain.name', read_only=True)
    
    class Meta:
        model = Topic
        fields = ['id', 'name', 'domain', 'domain_name', 'description', 'max_groups', 'current_groups', 'is_available']

class GroupSelectionSerializer(serializers.ModelSerializer):
    group_details = GroupSerializer(source='group', read_only=True)
    faculty_details = FacultySerializer(source='faculty', read_only=True)
    domain_details = DomainSerializer(source='domain', read_only=True)
    topic_details = TopicSerializer(source='topic', read_only=True)
    
    class Meta:
        model = GroupSelection
        fields = ['id', 'group', 'group_details', 'faculty', 'faculty_details', 'domain', 'domain_details', 'topic', 'topic_details', 'selected_at', 'is_approved']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class CreateGroupSerializer(serializers.Serializer):
    leader_roll_number = serializers.CharField()
    group_size = serializers.ChoiceField(choices=[2, 4])
    members = serializers.ListField(child=serializers.DictField())