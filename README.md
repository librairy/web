<p align="center">
  <img src="repository/brand.png">
</p>

Artificial intelligence for large collection of documents.

==============

Service is running at 8080 port.

ENV configuration:

|Variable|Default Value|
|:---------|:----------|
|LIBRAIRY_DEBUG|1|
|LIBRAIRY_SERVICE_PROT|http|
|LIBRAIRY_SERVICE_IP|127.0.0.1|
|LIBRAIRY_SERVICE_PORT|80|
|LIBRAIRY_CACHE_ENABLED|1|
|LIBRAIRY_CACHE_TTL|43200|
|LIBRAIRY_CACHE_IP|127.0.0.1|
|LIBRAIRY_CACHE_PORT|6379|
|LIBRAIRY_CACHE_PWD||

ENV threshold configuration:

|Variable|Default Value|Limits|
|:---------|:----------|:----------|
|LIBRAIRY_SERVICE_THRINT_DOMAIN|30|0 to 100|
|LIBRAIRY_SERVICE_THREXT_DOMAIN|0.002|0 to 1|

Docker execution:

1. ``docker build -t . librairy-web``
2. ``docker run -d -p *:8080 librairy-web`` where * is the port that you want to expose

If you want to use any environment variable use the -e flag i.e:

``docker run -d -p *:8080 -e LIBRAIRY_CACHE_IP="" -e LIBRAIRY_SERVICE_IP="" librairy-web``

## Team

* [Alejandro F. Carrera](https://github.com/alejandrofcarrera)
* [Carlos Badenes](https://github.com/cbadenes)
* [Oscar Corcho García](https://github.com/ocorcho)

## License

Apache License © 2016

