### Base Node APP#
FROM 408153089286.dkr.ecr.ap-south-1.amazonaws.com/node:18.17.0

### Create app directory
WORKDIR /app

### Copy the package.json file to Container 
COPY package*.json ./

RUN yarn

### Copy entire Source Code Local to Container
COPY . .

### Expose the APP in Below Port
ENV PORT 80
EXPOSE 80

### Start the server using the production build
CMD ["yarn", "dev"]
