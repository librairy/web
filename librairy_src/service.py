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
import config
import cache


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


def create_domain_relations(topics_info):
    relations_return = {}
    bad_relations = {}
    topic_clone = dict(topics_info)
    for tk in topics_info.keys():
        for tkc in topic_clone.keys():
            topic_key = tk + ':' + tkc
            topic_key_rev = tkc + ':' + tk
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

                # 5 is good balance between few words and much words
                if v > 5:
                    relations_return[topic_key] = v
                else:
                    bad_relations[topic_key] = v
    return relations_return


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


def get_service_topic(request, domain_id, topic_id):

    # Get Topic from cache if it is available
    top_info_return = cache.get_topic_cache(
        domain_id + ':' + topic_id
    )

    if top_info_return is None:

        # Get Topic from service
        try:
            top_info = requests.get(
                config.SERVICE_LISTEN_URL + '/api/domains/' +
                domain_id + '/topics/' + topic_id
            )
            if top_info.status_code == 200:
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
            cache.save_topic_cache(
                domain_id + ':' + topic_id, words_return
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
            '/topics?words=0&size=25'
        )
        if top_list.status_code == 200:
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

        # Get Information from cache or service
        top_info = get_service_topic(request, domain_id, top_id)

        # Save Topic information to return it
        if len(top_info):
            top_list_return[top_id] = top_info

    # Get Topic relations
    top_relations = cache.get_domain_relations(domain_id)
    if top_relations is None:
        top_relations = create_domain_relations(top_list_return)
        if len(top_relations):
            cache.save_domain_relations(domain_id, top_relations)

    # Return Topics
    return {
        'topics': top_list_return,
        'relations': top_relations
    }


def get_service_domain(request, domain_id):

    # Get Domain from cache if it is available
    dom_info_return = cache.get_domain_cache(domain_id)
    dom_cache_status = 1
    if dom_info_return is None:

        dom_cache_status = 0
        # Get Domain from service
        try:
            dom_info = requests.get(
                config.SERVICE_LISTEN_URL + '/api/domains/' + domain_id
            )
            if dom_info.status_code == 200:
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
            cache.save_domain_cache(domain_id, dom_info_return)

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
        if dom_id != 'default' and dom_id != '':

            # Get Information from cache
            dom_info, dom_st = get_service_domain(request, dom_id)

            # Clean all info about domains (domain does not exist at cache)
            if dom_st == 0:
                cache.clean_domain(dom_id)

            # Save Domain information to return it
            if len(dom_info):
                dom_list_return.append(dom_info)

    # Return Domains
    return dom_list_return
