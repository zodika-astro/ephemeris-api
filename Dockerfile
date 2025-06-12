FROM node:20-bullseye

# install build essentials & python
RUN apt-get update && apt-get install -y python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY . .
EXPOSE 8080
ENV BASIC_USER=${BASIC_USER} BASIC_PASS=${BASIC_PASS}
CMD ["node", "app.js"]
