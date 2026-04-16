FUXA is developed with NodeJS (backend) and Angular (frontend).

## Installing and Running

### Docker installation
sudo docker build -t myfuxa .
docker run -d -p 1881:1881 -v fuxa_appdata:/usr/src/app/FUXA-Pro/server/_appdata -v fuxa_db:/usr/src/app/FUXA-Pro/server/_db -v fuxa_logs:/usr/src/app/FUXA-Pro/server/_logs unocelli/fuxa-pro:latest

### Local installation
You need to have installed [Node](https://nodejs.org/en/about/previous-releases) 16.20.2 (npm 8.19.4) || 18.18.2 (npm 9.8.1).

**WARNING** In linux with nodejs Version 16.20.2 || 18.18.2 there are problems with the node-snap7 library for communication with Siemens S7 PLCs, if you don't intend to use it you can remove it from the server/package.json


cd ./server
npm install
npm start


### Electron
cd ./app
npm install
npm run package
