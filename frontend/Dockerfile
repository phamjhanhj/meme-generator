FROM php:8.2-apache

WORKDIR /var/www/html

# Enable apache rewrite (not strictly required but handy)
RUN a2enmod rewrite

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]
