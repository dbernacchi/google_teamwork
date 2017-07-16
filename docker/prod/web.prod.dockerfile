FROM nginx:1.10-alpine

ADD docker/prod/vhost.conf /etc/nginx/conf.d/default.conf

COPY . /var/www
