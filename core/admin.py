from django.contrib import admin
from .models import *

admin.site.register(EmergencyAlert)
admin.site.register(EmergencyMessage)
admin.site.register(EmergencyResponder)
admin.site.register(EmergencyType)

