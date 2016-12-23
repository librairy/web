#  -*- coding: utf-8 -*-

"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""

import traceback
import requests
import hashlib
import config
import os

if config.CACHE_REDIS_ENABLED:
    import cache

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


def create_compare_relations(compare_info):
    relations_return = {}
    bad_relations = {}
    for comparison in compare_info:
        source_key = comparison["source"]["container"]["id"] + ':' + \
            comparison["source"]["element"]["id"]
        destiny_key = comparison["end"]["container"]["id"] + ':' + \
            comparison["end"]["element"]["id"]
        topic_key = str(source_key) + '_' + str(destiny_key)
        topic_key_rev = str(destiny_key) + '_' + str(source_key)
        if topic_key not in relations_return and \
           topic_key_rev not in relations_return and \
           topic_key not in bad_relations and \
           topic_key_rev not in bad_relations:

            v = float(comparison["score"])
            if v > 0.002:
                relations_return[topic_key] = v
            else:
                bad_relations[topic_key] = v

    return relations_return


def create_domain_relations(topics_info):
    relations_return = {}
    bad_relations = {}
    topic_clone = dict(topics_info)
    for tk in topics_info.keys():
        for tkc in topic_clone.keys():
            topic_key = str(tk) + ':' + str(tkc)
            topic_key_rev = str(tkc) + ':' + str(tk)
            if tk != tkc and topic_key not in relations_return and \
               topic_key_rev not in relations_return and \
               topic_key not in bad_relations and topic_key_rev not in bad_relations:

                # get ratio between overlapping sets
                tkwords = set(topics_info[tk])
                tkcwords = set(topic_clone[tkc])
                overlap = tkwords.intersection(tkcwords)
                if len(tkwords) < len(tkcwords):
                    v = float(len(overlap)) / float(len(tkwords))
                else:
                    v = float(len(overlap)) / float(len(tkcwords))
                v = int(v * 100)

                # 30% is good balance between few words and much words
                if v > 30:
                    relations_return[topic_key] = v
                else:
                    bad_relations[topic_key] = v
    return relations_return


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


def get_service_compare(request, domain_list):

    json_to_send = {
        'description': 'comparison',
        'elements': []
    }
    compare_id = ''
    for domain in domain_list:
        json_to_send['elements'].append({'id': domain})
        compare_id += domain
    compare_id = hashlib.sha256(compare_id).hexdigest().lower()
    json_to_send['name'] = compare_id

    # Get Comparison from cache
    if config.CACHE_REDIS_ENABLED:
        comp_info = cache.get_domain_compare(compare_id)
    else:
        comp_info = None
    if comp_info is None:

        # Get Domain comparison from service
        try:
            comp_info = requests.post(
                config.SERVICE_LISTEN_URL + '/api/comparisons',
                json=json_to_send
            )
            if comp_info.status_code == 200:
                config.flask_log.info(
                    '[Service] Comparison ' + compare_id + ' done'
                )
                comp_info = comp_info.json()
            else:
                config.logging_exception(request, comp_info)
                comp_info = {}
        except requests.ConnectionError:
            tb = traceback.format_exc()
            config.logging_exception(request, tb)
            comp_info = {}

        if len(comp_info):
            comp_info = create_compare_relations(comp_info['values'])

            if config.CACHE_REDIS_ENABLED:
                cache.save_domain_compare(compare_id, comp_info)

    return comp_info


def get_service_topic(request, domain_id, topic_id, topic_uri):

    # Get Topic from cache if it is available

    if config.CACHE_REDIS_ENABLED:
        top_info_return = cache.get_topic_cache(
            domain_id + ':' + topic_uri
        )
    else:
        top_info_return = None

    words_return = {}

    if top_info_return is None:

        # Get Topic from service
        try:
            top_info = requests.get(
                config.SERVICE_LISTEN_URL + '/api/domains/' +
                domain_id + '/topics/' + topic_id
            )
            if top_info.status_code == 200:
                config.flask_log.info(
                    '[Service] Downloaded Topic: ' + topic_id +
                    ' from domain: ' + domain_id
                )
                top_info_return = top_info.json()
            else:
                config.logging_exception(request, top_info)
                top_info_return = {}
        except requests.ConnectionError:
            tb = traceback.format_exc()
            config.logging_exception(request, tb)
            top_info_return = {}

        # Save Topic to cache
        if len(top_info_return):

            # Clean Topic
            words = top_info_return['words']
            words_return = {
                word['ref']['name']: word['value'] for word in words
            }

            # Save
            if config.CACHE_REDIS_ENABLED:
                cache.save_topic_cache(
                    domain_id + ':' + topic_uri, words_return
                )

        top_info_return = words_return

    # Order words by obtained score
    top_info_return = sorted(top_info_return, key=top_info_return.get, reverse=True)

    # Return Domain
    return top_info_return


def get_service_topics(request, domain_id):
    top_list_return = {}

    # Get Topics (specific domain) from service
    try:
        top_list = requests.get(
            config.SERVICE_LISTEN_URL + '/api/domains/' + domain_id +
            '/topics?words=0'
        )
        if top_list.status_code == 200:
            config.flask_log.info(
                '[Service] Downloaded Topics from: ' + domain_id
            )
            top_list = top_list.json()
        else:
            config.logging_exception(request, top_list)
            top_list = []
    except requests.ConnectionError:
        tb = traceback.format_exc()
        config.logging_exception(request, tb)
        top_list = []

    # Get Topic information for each id
    for top in top_list:
        top_id = top.get('ref').get('id')
        top_uri = os.path.basename(top.get('ref').get('uri'))

        # Get Information from cache or service
        top_info = get_service_topic(
            request, domain_id, top_id, top_uri
        )

        # Save Topic information to return it
        if len(top_info):
            top_list_return[top_uri] = top_info

    # Get Topic relations
    if config.CACHE_REDIS_ENABLED:
        top_relations = cache.get_domain_relations(domain_id)
    else:
        top_relations = None
    if top_relations is None:
        top_relations = create_domain_relations(top_list_return)
        if len(top_relations) and config.CACHE_REDIS_ENABLED:
            cache.save_domain_relations(domain_id, top_relations)

    # Return Topics
    return {
        'topics': top_list_return,
        'relations': top_relations
    }


def get_service_domain(request, domain_id):

    # Get Domain from cache if it is available
    if config.CACHE_REDIS_ENABLED:
        dom_info_return = cache.get_domain_cache(domain_id)
    else:
        dom_info_return = None
    dom_cache_status = 1

    if dom_info_return is None:

        dom_cache_status = 0
        # Get Domain from service
        try:
            dom_info = requests.get(
                config.SERVICE_LISTEN_URL + '/api/domains/' + domain_id
            )
            if dom_info.status_code == 200:
                config.flask_log.info(
                    '[Service] Downloaded Domain: ' + domain_id
                )
                dom_info_return = dom_info.json()
            else:
                config.logging_exception(request, dom_info)
                dom_info_return = {}
        except requests.ConnectionError:
            tb = traceback.format_exc()
            config.logging_exception(request, tb)
            dom_info_return = {}

        # Save Domain to cache
        if len(dom_info_return):
            dom_info_return['name'] = dom_info_return['container']['name']
            dom_info_return['id'] = dom_info_return['container']['id']
            del dom_info_return['container']

            if config.CACHE_REDIS_ENABLED:
                cache.save_domain_cache(domain_id, dom_info_return)
                dom_cache_status = 1

    # Return Domain
    return dom_info_return, dom_cache_status


def get_service_domains(request):
    dom_list_return = []

    # Get Domains from service
    try:
        dom_list = requests.get(
            config.SERVICE_LISTEN_URL + '/api/domains'
        )
        if dom_list.status_code == 200:
            dom_list = dom_list.json()
        else:
            config.logging_exception(request, dom_list)
            dom_list = []
    except requests.ConnectionError:
        tb = traceback.format_exc()
        config.logging_exception(request, tb)
        dom_list = []

    # Get Domain information for each id
    for dom in dom_list:
        dom_id = dom.get('id', '')
        if dom_id != '':

            # Get Information from cache
            dom_info, dom_st = get_service_domain(request, dom_id)

            # Clean all info about domains (domain does not exist at cache)
            if dom_st == 0 and config.CACHE_REDIS_ENABLED:
                cache.clean_domain(dom_id)

            # Save Domain information to return it
            if len(dom_info):
                dom_list_return.append(dom_info)

    # Return Domains
    return dom_list_return
