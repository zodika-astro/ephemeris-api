FROM node:20-bullseye

# install build essentials & python
RUN apt-get update && apt-get install -y python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
EXPOSE 80800
ENV BASIC_USER=${BASIC_USER} BASIC_PASS=${BASIC_PASS}
CMD ["node", "app.js"]
