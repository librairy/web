#  -*- coding: utf-8 -*-

"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""

from flask import Flask, request, render_template, make_response
from flask_negotiate import produces, consumes
from librairy_src import config, service
import traceback
import json

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


app = Flask(
    __name__,
    template_folder="./librairy_src/templates",
    static_folder="./librairy_src/static"
)


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


@app.after_request
def after_request(response):
    config.logging_request(request, response)
    return response


@app.errorhandler(Exception)
def exceptions(e):
    tb = traceback.format_exc()
    config.logging_exception(request, tb)
    if 'status_code' in e:
        return e.status_code
    else:
        return '', 500


def json_response(json_object, state=200):
    obj = json_object
    if isinstance(obj, set):
        obj = list(obj)
    r = make_response(json.dumps(obj), state)
    r.headers['Content-Type'] = 'application/json'
    return r


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


@app.route('/endpoint/compare', methods=['POST'])
@produces('application/json')
@consumes('application/json')
def get_domains_compare():

    domains_list = request.get_json(silent=True)
    return_dict = {
        'external': {},
        'internal': {}
    }
    if domains_list is None:
        return json_response(return_dict)
    else:
        if not len(domains_list):
            return json_response(return_dict)
        return_dict['external'] = service.get_service_compare(
            request, domains_list
        )
        return_dict['internal'] = {
            domain: service.get_service_topics(request, domain) for domain in domains_list
        }
        return json_response(return_dict)


@app.route('/endpoint/domains', methods=['GET'])
@produces('application/json')
def get_domains_list():
    return json_response(
        service.get_service_domains(request)
    )


@app.route('/', methods=['GET'])
def render_librairy_web():
    return render_template('index.html', language_values={
        'msg-loading-dom': {
            'en': 'Loading domains',
            'es': 'Cargando dominios'
        },
        'msg-loading-top': {
            'en': 'Loading topics and links',
            'es': 'Cargando tópicos y conexiones'
        },
        'msg-connection': {
            'en': 'There was a connection error',
            'es': 'Hubo un error de conexión'
        },
        'msg-empty': {
            'en': 'There are no available domains',
            'es': 'No hay dominios disponibles'
        },
        'msg-try': {
            'en': 'Try again later',
            'es': 'Inténtelo más tarde'
        },
        'but-viz': {
            'en': 'Visualize domains',
            'es': 'Visualizar dominios'
        },
        'but-back': {
            'en': 'Back to domains',
            'es': 'Volver al menú'
        }
    })


if __name__ == '__main__':

    app.run(
        host=config.FLASK_LISTEN_IP,
        port=config.FLASK_LISTEN_PORT,
        debug=False
    )
