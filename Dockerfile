FROM ubuntu

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY src/ ./src



RUN npm install

EXPOSE 3001

ENTRYPOINT ["node", "src/server.js"]
# CMD ["src/server.js"]
# docker run --env-file .env your-image-name
