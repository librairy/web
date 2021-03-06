#  -*- coding: utf-8 -*-

"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""

import os
import logging
from time import strftime

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


# GENERAL

shortname = 'librairy'
version = '1.1.0'
longname = 'Librairy Web'

# FLASK

FLASK_LISTEN_IP = '0.0.0.0'
FLASK_LISTEN_PORT = int(os.environ.get('LIBRAIRY_PORT', 8080))
FLASK_DEBUG_MODE = int(os.environ.get('LIBRAIRY_DEBUG', 1)) == 1
FLASK_LOG_FILE = os.environ.get('LIBRAIRY_LOG', '/var/log/librairy.log')


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


flask_log_level = 'ERROR' if not FLASK_DEBUG_MODE else 'DEBUG'
flask_log_handler = logging.FileHandler(FLASK_LOG_FILE)
flask_log = logging.Logger('librairy-logger')
flask_log.setLevel(flask_log_level)
flask_log.addHandler(flask_log_handler)


def logging_request(request, response):
    timestamp = strftime('[%Y-%b-%d %H:%M]')
    flask_log.info(
        '%s %s %s %s %s %s', timestamp, request.remote_addr, request.method,
        request.scheme, request.full_path, response.status
    )


def logging_exception(request, traceback):
    timestamp = strftime('[%Y-%b-%d %H:%M]')
    flask_log.error(
        '\n%s %s %s %s %s\n%s', timestamp, request.remote_addr, request.method,
        request.scheme, request.full_path, traceback
    )


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


def raise_config_exception(field, parameters):
    raise Exception(field + ' must be ' + parameters)


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

# SERVICE

SERVICE_LISTEN_PROT = str(os.environ.get('LIBRAIRY_SERVICE_PROT', 'http'))
if SERVICE_LISTEN_PROT != 'http' and SERVICE_LISTEN_PROT != 'https':
    raise_config_exception('Service protocol', 'http or https')

SERVICE_LISTEN_IP = str(os.environ.get('LIBRAIRY_SERVICE_IP', '127.0.0.1'))
SERVICE_LISTEN_PORT = int(os.environ.get('LIBRAIRY_SERVICE_PORT', 80))

if SERVICE_LISTEN_PORT == 443 and SERVICE_LISTEN_PROT == 'http' or \
   SERVICE_LISTEN_PORT == 80 and SERVICE_LISTEN_PROT == 'https':
    raise_config_exception('Service port', 'equal to protocol')

SERVICE_LISTEN_URL = SERVICE_LISTEN_PROT + '://' + SERVICE_LISTEN_IP
if SERVICE_LISTEN_PORT != 80 and SERVICE_LISTEN_PORT != 443:
    SERVICE_LISTEN_URL += ':' + str(SERVICE_LISTEN_PORT)

# SERVICE WINDOW

SERVICE_THIDOM = int(os.environ.get('LIBRAIRY_SERVICE_THRINT_DOMAIN', 30))
SERVICE_THEDOM = float(os.environ.get('LIBRAIRY_SERVICE_THREXT_DOMAIN', 0.002))

# SERVICE CACHE

CACHE_REDIS_ENABLED = int(os.environ.get('LIBRAIRY_CACHE_ENABLED', 1)) == 1

CACHE_REDIS_TTL = int(os.environ.get('LIBRAIRY_CACHE_TTL', 60 * 60 * 12))
CACHE_REDIS_LISTEN_IP = str(os.environ.get('LIBRAIRY_CACHE_IP', '127.0.0.1'))
CACHE_REDIS_LISTEN_PORT = int(os.environ.get('LIBRAIRY_CACHE_PORT', 6379))
CACHE_REDIS_PWD = str(os.environ.get('LIBRAIRY_CACHE_PWD'))
if CACHE_REDIS_PWD == '' or CACHE_REDIS_PWD == 'None':
    CACHE_REDIS_PWD = None
