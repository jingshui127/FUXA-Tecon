FUXA is developed with NodeJS (backend) and Angular (frontend).

## Installing and Running

### Docker installation
sudo docker build -t myfuxa .
docker run -d -p 1881:1881 -v fuxa_appdata:/usr/src/app/FUXA-Pro/server/_appdata -v fuxa_db:/usr/src/app/FUXA-Pro/server/_db -v fuxa_logs:/usr/src/app/FUXA-Pro/server/_logs unocelli/fuxa-pro:latest

### Local installation
You need to have installed [Node](https://nodejs.org/en/about/previous-releases) 18.20.4 or newer.
Node.js 18.20.4 is the recommended and tested baseline. Newer Node.js versions can be tried, up to Node.js 22, but native dependencies should be verified before release.

**WARNING** In linux with nodejs Version 18.20.4 there are problems with the node-snap7 library for communication with Siemens S7 PLCs, if you don't intend to use it you can remove it from the server/package.json


cd ./server
npm install
npm start


### Electron
Install the server dependencies first. The Electron package copies the server, `server/node_modules`, and the built client from `client/dist`.

cd ./server
npm install

Make sure the frontend build exists in `client/dist`.

cd ../app/electron
npm install
npm run package

The unpacked Windows app is generated in `app/electron/dist/win-unpacked/My App.exe`.
