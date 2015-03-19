from django.core.urlresolvers import reverse
from proso.django.response import pass_get_parameters_string, append_get_parameters
from django.core.cache import cache
import json as json_lib


IGNORE_GET = []


CACHE_EXPIRATION = 60 * 60 * 24 * 30


def url(request, json_list, nested):
    urls = cache.get('proso_urls')
    if urls is None:
        urls = {}
    else:
        urls = json_lib.loads(urls)
    cache_updated = False
    pass_string = pass_get_parameters_string(request, ['filter_column', 'filter_value'] + IGNORE_GET)
    for json in json_list:
        if 'object_type' not in json or 'id' not in json:
            continue
        key = 'show_%s_%s' % (json['object_type'], json['id'])
        if key in urls:
            json['url'] = urls[key]
        else:
            cache_updated = True
            json['url'] = reverse('show_' + json['object_type'], kwargs={'id': json['id']})
            urls[key] = json['url']
        json['url'] = append_get_parameters(json['url'], pass_string)
    if cache_updated:
        cache.set('proso_urls', json_lib.dumps(urls), CACHE_EXPIRATION)