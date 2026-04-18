FROM node:18-bookworm

RUN apt-get update && apt-get install -y dos2unix python3-setuptools

WORKDIR /usr/src/app

WORKDIR /usr/src/app/FUXA

COPY ./client /usr/src/app/FUXA
COPY ./server /usr/src/app/FUXA

WORKDIR /usr/src/app/FUXA/server
RUN npm install

RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev && \
  apt-get autoremove -yqq --purge && \
  apt-get clean  && \
  rm -rf /var/lib/apt/lists/*  && \
  npm install --build-from-source --sqlite=/usr/bin sqlite3

ADD . /usr/src/app/FUXA

WORKDIR /usr/src/app/FUXA/server

EXPOSE 1881

CMD [ "npm", "start" ]
