from django.contrib import admin
from .models import *
from django.contrib.auth.admin  import UserAdmin
from django import forms
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError


User = get_user_model()  

class CustomUserCreationForm(forms.ModelForm):
    password1 = forms.CharField(
        label="Password",
        widget=forms.PasswordInput,
        min_length=6,
    )
    password2 = forms.CharField(
        label="Confirm Password",
        widget=forms.PasswordInput,
    )

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", 
                       "phone_number", "user_type"    
                       )

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            raise ValidationError("Passwords do not match.")
        
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])  
        if commit:
            user.save()
        return user

# Custom UserAdmin
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    fieldsets = UserAdmin.fieldsets
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "first_name", "last_name", "phone_number", "user_type",
                       "password1", "password2"),
        }),
    )

admin.site.register(User, CustomUserAdmin) 
admin.site.register(EmergencyAlert)
admin.site.register(EmergencyMessage)
admin.site.register(EmergencyResponder)
admin.site.register(EmergencyType)



