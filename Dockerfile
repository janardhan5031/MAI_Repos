### Base Node APP#
FROM node:16.15-alpine

### Create app directory
WORKDIR /app

### Copy the package.json file to Container 
COPY package*.json ./

#RUN npm update
RUN npm install --force

### Copy entire Source Code Local to Container
COPY . .

### Creates a "dist" folder with the production build
RUN npm run build

### Expose the APP in Below Port
EXPOSE 4000

### Start the server using the production build
CMD ["node","dist/server.js"]
