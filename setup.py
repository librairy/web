#  -*- coding: utf-8 -*-

"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""

import os
from setuptools import setup, find_packages

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


def read(name):
    return open(os.path.join(os.path.dirname(__file__), name)).read()

setup(
    name="librairy-web",
    version="1.0.0",
    author="Alejandro F. Carrera",
    author_email="alejfcarrera@mail.ru",
    description="Librairy Website",
    license="Apache License",
    keywords="ai lnp visualization flask webapp",
    url="https://github.com/librairy/web",
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    install_requires=['flask', 'flask_negotiate', 'requests'],
    classifiers=[],
    scripts=['librairy-web.py']
)