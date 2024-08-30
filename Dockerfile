### Base Node APP#
FROM 408153089286.dkr.ecr.ap-south-1.amazonaws.com/node:18.17.0

### Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

### Create app directory
WORKDIR /app

### Copy the package.json file to Container 
COPY package*.json ./

#RUN npm update
RUN npm i

### Copy entire Source Code Local to Container
COPY . .

### Creates a "dist" folder with the production build
RUN npm run build

### Set NODE_ENV environment variable
ENV NODE_ENV production

ENV JAVA_OPTS "-Djava.security.auth.login.config=src/common/kafka/kafka-client-jaas.conf"


### Expose the APP in Below Port
EXPOSE 4000


### Start the server using the production build
CMD [ "node", "dist/main.js" ]
