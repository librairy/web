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
        config.raise_config_exception('Redis Cache', 'online')
        return None


CACHE_DB = {
    'domains': redis_create_pool(
        config.CACHE_REDIS_LISTEN_IP, config.CACHE_REDIS_LISTEN_PORT,
        config.CACHE_REDIS_PWD, 0
    ),
    'topics': redis_create_pool(
        config.CACHE_REDIS_LISTEN_IP, config.CACHE_REDIS_LISTEN_PORT,
        config.CACHE_REDIS_PWD, 1
    )
}


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


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


def save_topic_cache(topic_id, values):
    CACHE_DB['topics'].hmset(topic_id, values)
    CACHE_DB['topics'].expire(topic_id, config.CACHE_REDIS_TTL)
