from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        min_length=8,
        max_length=128,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ("id", "email", "password")
        read_only_fields = ("id",)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already registered")
        return email

    def validate(self, attrs):
        candidate = User(email=attrs["email"])

        try:
            validate_password(
                attrs["password"],
                user=candidate,
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError({
                "password": list(exc.messages),
            }) from exc

        return attrs

    def create(self, validated_data):
        try:
            with transaction.atomic():
                return User.objects.create_user(**validated_data)
        except IntegrityError as exc:
            if User.objects.filter(
                email__iexact=validated_data["email"]
            ).exists():
                raise serializers.ValidationError({
                    "email": "Email already registered",
                }) from exc
            raise


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name")
        read_only_fields = fields


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()
    service = serializers.CharField()
