# Generated by Django 5.2.4 on 2025-07-26 04:45

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_alter_emergencyalert_user'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='emergencyalert',
            options={'ordering': ['-timestamp']},
        ),
    ]
