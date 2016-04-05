# -*- coding: utf-8 -*-
# Generated by Django 1.9.1 on 2016-03-10 07:41
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.db.models.manager


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Action',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(max_length=50)),
                ('name', models.CharField(max_length=50)),
                ('url', models.CharField(max_length=200)),
            ],
            managers=[
                ('object', django.db.models.manager.Manager()),
            ],
        ),
        migrations.CreateModel(
            name='Concept',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifier', models.CharField(blank=True, max_length=20)),
                ('query', models.TextField()),
                ('name', models.CharField(max_length=50)),
                ('lang', models.CharField(max_length=2)),
                ('active', models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(max_length=50)),
                ('value', models.CharField(max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='UserStat',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stat', models.CharField(max_length=50)),
                ('time', models.DateTimeField(auto_now=True)),
                ('value', models.FloatField()),
                ('concept', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='proso_concepts.Concept')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stats', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='tag',
            unique_together=set([('type', 'value')]),
        ),
        migrations.AddField(
            model_name='concept',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='concepts', to='proso_concepts.Tag'),
        ),
        migrations.AddField(
            model_name='action',
            name='concept',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='actions', to='proso_concepts.Concept'),
        ),
        migrations.AlterUniqueTogether(
            name='userstat',
            unique_together=set([('concept', 'user', 'stat')]),
        ),
        migrations.AlterUniqueTogether(
            name='concept',
            unique_together=set([('identifier', 'lang')]),
        ),
    ]
