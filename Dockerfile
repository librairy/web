FROM alejandrofcarrera/phusion.python
MAINTAINER Alejandro F. Carrera

ENV HOME /usr/lib/librairy

# Create directories & virtual env
COPY . /usr/lib/librairy
RUN virtualenv $HOME/.env
WORKDIR /usr/lib/librairy

# Configure runit
ADD ./my_init.d/ /etc/my_init.d/
ONBUILD ./my_init.d/ /etc/my_init.d/

CMD ["/sbin/my_init"]

VOLUME ["/usr/lib/librairy"]

EXPOSE 8080
