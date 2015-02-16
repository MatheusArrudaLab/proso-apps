from django.contrib.auth.models import User
from django.contrib.auth.signals import user_logged_in
from django.conf import settings
from django.utils import translation
from lazysignup.models import LazyUser
from django.db import connection
from contextlib import closing
from proso_flashcards.models import DecoratedAnswer


def convert_lazy_user(user):
    LazyUser.objects.filter(user=user).delete()
    user.username = get_unused_username(user)
    user.save()


def is_username_present(username):
    if User.objects.filter(username=username).count():
        return True
    return False


def is_lazy(user):
    if user.is_anonymous() or len(user.username) != 30:
        return False
    return bool(LazyUser.objects.filter(user=user).count() > 0)


def is_named(user):
    return user.first_name and user.last_name


def get_unused_username(user):
    condition = True
    append = ""
    i = 2
    while condition:
        username = user.first_name + user.last_name + append
        condition = is_username_present(username)
        append = '{0}'.format(i)
        i = i + 1
    return username


def get_points(user):
    with closing(connection.cursor()) as cursor:
        cursor.execute(
            '''
            SELECT
                COUNT(proso_models_answer.id)
            FROM
                proso_models_answer
            WHERE
                user_id = %s
                AND
                proso_models_answer.item_asked_id = proso_models_answer.item_answered_id
            ''', [user.id])
        return cursor.fetchone()[0]


def get_answered_count(user):
    with closing(connection.cursor()) as cursor:
        cursor.execute(
            '''
            SELECT
                COUNT(proso_models_answer.id)
            FROM
                proso_models_answer
            WHERE
                user_id = %s
            ''', [user.id])
        return cursor.fetchone()[0]


def to_serializable(user):
    return {
        'username': user.username,
        'points': get_points(user),
    }


def get_lang_from_last_answer(user):
    try:
        latest_answer = DecoratedAnswer.objects.filter(user=user).latest('answer__inserted')
        language_code = latest_answer.language
        return language_code
    except DecoratedAnswer.DoesNotExist:
        return None


def set_lang_from_last_answer(sender, user, request, **kwargs):
    language_code = get_lang_from_last_answer(user)
    if language_code is not None:
        translation.activate(language_code)
        request.LANGUAGE_CODE = translation.get_language()
        request.COOKIES[settings.LANGUAGE_COOKIE_NAME] = language_code
        request.session['django_language'] = language_code


user_logged_in.connect(set_lang_from_last_answer)
