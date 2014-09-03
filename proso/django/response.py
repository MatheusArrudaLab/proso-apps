# -*- coding: utf-8 -*-
from django.http import HttpResponse
from django.utils import simplejson
from django.conf import settings


class JsonResponse(HttpResponse):

    """
        JSON response
    """

    def __init__(self, content, mimetype='application/json',
                 status=None, content_type=None):
        indent = 4 if settings.DEBUG else None
        super(JsonResponse, self).__init__(
            content=simplejson.dumps(content, indent=indent),
            mimetype=mimetype,
            status=status,
            content_type=content_type,
        )
