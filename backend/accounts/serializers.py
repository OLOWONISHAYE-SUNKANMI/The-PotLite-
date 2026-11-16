from rest_framework import serializers
from .models import User, UserRole


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'name',
            'email',
            'phone',
            'role',
            'title',
            'two_factor_enabled',
            'created_at',
        ]

    name = serializers.SerializerMethodField()

    def get_name(self, obj):
        return obj.get_full_name() or obj.username


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=2)
    name = serializers.CharField(min_length=1)
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    password = serializers.CharField(min_length=4, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.ORGANIZER)
    organizationId = serializers.IntegerField(required=False, default=1)
    organizationName = serializers.CharField(required=False, allow_blank=True, default='')
    title = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        username = data['username'].strip().lower()
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "Username already registered."})
        
        email = data.get('email', '').strip().lower()
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        
        return data

    def create(self, validated_data):
        username = validated_data['username'].strip().lower()
        email = validated_data.get('email', '').strip().lower()
        if not email:
            clean_user = ''.join(c for c in username if c.isalnum() or c == '_') or 'user'
            email = f"{clean_user}@thepotlite.org"

        name_parts = validated_data['name'].strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            phone=validated_data.get('phone', ''),
            role=validated_data.get('role', UserRole.ORGANIZER),
            title=validated_data.get('title') or ('Team Organizer' if validated_data.get('role') == UserRole.ORGANIZER else 'Parent / Guardian')
        )
        return user


class LoginSerializer(serializers.Serializer):
    usernameOrEmail = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, default='')
