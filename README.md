# NestJS Proxy Application

## Description

This NestJS Proxy application is designed to fetch and reproduce web pages through a proxy. 
It allows you to request a page from a given URL and get a proxied version of that page.

## Prerequisites

- Node.js (https://nodejs.org/)
- Docker (https://www.docker.com/get-started)
- Docker Compose (https://docs.docker.com/compose/install/)

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Vovaaaaaa/nestjs-proxy-app.git
   cd <path-to-nestjs-proxy-app-repo>

2. **Install Dependencies**

   ```bash
   npm install

3. **Build Docker Image**

   ```bash
   docker-compose build

## Running the Application

1. **Start the Application**

   ```bash
   docker-compose up

2. **Access the Proxy Service**

   ```http
   http://localhost:3000/?url={TARGET_URL}

  Replace {TARGET_URL} with the URL of the page you want to proxy. For example:
   http://localhost:3000/?url=https://docs.nestjs.com/websockets/gateways
   
## Running Tests

1. **Running tests**

   ```bash
   docker-compose exec app npm run test





