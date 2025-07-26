from django import forms
from .models import EmergencyResponder
from .models import User
from django.contrib.auth.forms import UserCreationForm

class UserProfileForm(forms.ModelForm):
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)
    email = forms.EmailField(required=True)
    
    class Meta:
        model = EmergencyResponder
        fields = ['organization', 'contact_number', 'emergency_types']
        widgets = {
            'emergency_types': forms.CheckboxSelectMultiple
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.user:
            self.fields['first_name'].initial = self.instance.user.first_name
            self.fields['last_name'].initial = self.instance.user.last_name
            self.fields['email'].initial = self.instance.user.email
    
    def save(self, commit=True):
        responder = super().save(commit=False)
        user = responder.user
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
            responder.save()
            self.save_m2m()
        return responder
    

class VictimRegistrationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['phone_number', "username","first_name", "last_name", "email",  "password1", "password2"]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.user_type = "victim"  
        if commit:
            user.save()
        return user  