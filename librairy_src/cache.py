#  -*- coding: utf-8 -*-

"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""

import config
import redis

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


def redis_create_pool(h, p, pwd, db):
    __redis_db = redis.ConnectionPool(host=h, port=p, password=pwd, db=db)
    __redis_db = redis.Redis(connection_pool=__redis_db)
    try:
        __redis_db.client_list()
        return __redis_db
    except redis.ConnectionError:
        config.raise_config_exception('Redis cache', 'online')
        return None
    except redis.ResponseError:
        config.raise_config_exception('Redis configuration', 'correct')
        return None


CACHE_DB = {
    'domains': redis_create_pool(
        config.CACHE_REDIS_LISTEN_IP, config.CACHE_REDIS_LISTEN_PORT,
        config.CACHE_REDIS_PWD, 0
    ),
    'topics': redis_create_pool(
        config.CACHE_REDIS_LISTEN_IP, config.CACHE_REDIS_LISTEN_PORT,
        config.CACHE_REDIS_PWD, 1
    ),
    'relations': redis_create_pool(
        config.CACHE_REDIS_LISTEN_IP, config.CACHE_REDIS_LISTEN_PORT,
        config.CACHE_REDIS_PWD, 2
    ),
    'comparisons': redis_create_pool(
        config.CACHE_REDIS_LISTEN_IP, config.CACHE_REDIS_LISTEN_PORT,
        config.CACHE_REDIS_PWD, 3
    )
}


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


def clean_domain(domain_id):
    CACHE_DB['domains'].delete(domain_id)
    CACHE_DB['relations'].delete(domain_id)
    topics_keys = CACHE_DB['topics'].keys(domain_id + '*')
    for topic_key in topics_keys:
        CACHE_DB['topics'].delete(topic_key)


def get_domain_compare(compare_id):
    if CACHE_DB['comparisons'].exists(compare_id):
        return CACHE_DB['comparisons'].hgetall(compare_id)
    else:
        return None


def save_domain_compare(compare_id, values):
    CACHE_DB['comparisons'].hmset(compare_id, values)
    CACHE_DB['comparisons'].expire(compare_id, 3600)


def get_domain_relations(domain_id):
    if CACHE_DB['relations'].exists(domain_id):
        return CACHE_DB['relations'].hgetall(domain_id)
    else:
        return None


def save_domain_relations(domain_id, values):
    CACHE_DB['relations'].hmset(domain_id, values)
    CACHE_DB['relations'].expire(domain_id, config.CACHE_REDIS_TTL)


def get_domain_cache(domain_id):
    if CACHE_DB['domains'].exists(domain_id):
        return CACHE_DB['domains'].hgetall(domain_id)
    else:
        return None


def save_domain_cache(domain_id, values):
    CACHE_DB['domains'].hmset(domain_id, values)
    CACHE_DB['domains'].expire(domain_id, config.CACHE_REDIS_TTL)


def get_topic_cache(topic_id):
    if CACHE_DB['topics'].exists(topic_id):
        return CACHE_DB['topics'].hgetall(topic_id)
    else:
        return None


def save_topic_cache(topic_id, words):
    CACHE_DB['topics'].hmset(topic_id, words)
    CACHE_DB['topics'].expire(topic_id, config.CACHE_REDIS_TTL)
