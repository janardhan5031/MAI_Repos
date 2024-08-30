### Base Node APP#
FROM node:16.15-alpine

### Create app directory
WORKDIR /app

### Copy the package.json file to Container 
COPY package.json ./
COPY package*.json ./

#RUN npm update
RUN npm i

### Copy entire Source Code Local to Container
COPY . .

### Expose the APP in Below Port
EXPOSE 3000

### Start the server using the production build
CMD [ "npm", "start" ]
