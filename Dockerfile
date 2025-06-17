# Use the official Node.js 20 Bullseye image as the base
FROM node:20-bullseye

# Install system dependencies required for swisseph and other build tools
# python3 and build-essential are often needed for compiling native Node.js modules
RUN apt-get update && apt-get install -y python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
# This ensures npm dependencies are reinstalled only if package.json changes
COPY package*.json ./

# Install Node.js dependencies
# Use --production to only install dependencies listed under 'dependencies'
# This keeps the production image lean by omitting 'devDependencies' (like nodemon)
RUN npm install --production

# Copy the rest of the application code into the container
COPY . .

# Set appropriate permissions for the ephemeris data directory
# This is crucial for swisseph to read its ephe files
RUN chmod -R 755 /app/ephe

# Expose the port on which the application will listen
EXPOSE 8080

# Command to run the application when the container starts
# Use "node app.js" for production to run the application directly,
# without development tools like nodemon.
CMD ["node", "app.js"]
