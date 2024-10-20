# Use an official Node.js image as the base
FROM node:18-alpine

# Install required dependencies
RUN apk add --no-cache \
    bash \
    curl \
    freetype \
    libpng \
    libjpeg-turbo \
    nss \
    libx11 \
    libxcomposite \
    libxrandr \
    libxi \
    xdg-utils \
    ttf-freefont \
    chromium \
    libstdc++ \
    harfbuzz

# Set the environment variable for Puppeteer to use Chromium
ENV CHROME_BIN=/usr/bin/chromium-browser

# Set the working directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the required port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]
