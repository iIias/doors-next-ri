# Copyright IBM Corp. 2024
#
FROM python:3.10.15



USER root

#
WORKDIR /app

#
COPY ./requirements.txt /app/requirements.txt

#
RUN pip3 install --no-cache-dir --upgrade -r /app/requirements.txt

#
COPY ./dng-ri.crt /app/dng-ri.crt

#
COPY ./dng-ri.key /app/dng-ri.key

COPY ./.env /app/.env
#
COPY ./src /app/src
COPY ./public /app/public

CMD ["python3","src/app.py"]