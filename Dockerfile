FROM node:18-bookworm

RUN apt-get update && apt-get install -y dos2unix

# Create app directory
WORKDIR /usr/src/app

# Install build dependencies for node-odbc
#RUN apt-get update && apt-get install -y build-essential unixodbc unixodbc-dev

WORKDIR /usr/src/app/FUXA

COPY ./client /usr/src/app/FUXA
COPY ./server /usr/src/app/FUXA
#COPY ./odbc /usr/src/app/FUXA
#RUN ls -R /usr/src/app
#WORKDIR /usr/src/app/FUXA

# Convert the script to Unix format and make it executable
#WORKDIR /usr/src/app/FUXA/odbc
#RUN dos2unix install_odbc_drivers.sh && chmod +x install_odbc_drivers.sh

#WORKDIR /usr/src/app/FUXA/odbc
#RUN ./install_odbc_drivers.sh

# Change working directory
#WORKDIR /usr/src/app

# Copy odbcinst.ini to /etc
#RUN cp FUXA/odbc/odbcinst.ini /etc/odbcinst.ini

# Install Fuxa server
WORKDIR /usr/src/app/FUXA/server
RUN npm install

# Workaround for sqlite3 https://stackoverflow.com/questions/71894884/sqlite3-err-dlopen-failed-version-glibc-2-29-not-found
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev && \
  apt-get autoremove -yqq --purge && \
  apt-get clean  && \
  rm -rf /var/lib/apt/lists/*  && \
  npm install --build-from-source --sqlite=/usr/bin sqlite3

# Add project files
ADD . /usr/src/app/FUXA

# Set working directory
WORKDIR /usr/src/app/FUXA/server

# Expose port
EXPOSE 1881

# Start the server
CMD [ "npm", "start" ]