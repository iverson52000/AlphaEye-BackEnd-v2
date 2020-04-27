FROM node:8.11.1

# Create app directory
RUN mkdir -p /usr/src/AlphaEye-BackEnd
WORKDIR /usr/src/AlphaEye-BackEnd

# Install app dependencies
COPY package.json /usr/src/AlphaEye-BackEnd
RUN npm install

# Bundle app source
COPY . /usr/src/AlphaEye-BackEnd

# Build arguments
ARG NODE_VERSION=8.11.1

# Environment
ENV NODE_VERSION $NODE_VERSION