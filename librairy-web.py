#  -*- coding: utf-8 -*-

"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""

from flask import Flask, Response, request, render_template
from librairy_src import config, service
import traceback

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


# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


@app.route('/', methods=['GET'])
def render_librairy_web():
    return render_template('index.html')


if __name__ == '__main__':

    app.run(
        host=config.FLASK_LISTEN_IP,
        port=config.FLASK_LISTEN_PORT,
        debug=False
    )
