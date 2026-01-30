<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

#  Scalable Webhook Management Platform

A robust, production-ready NestJS platform designed to handle webhook subscriptions, asynchronous event processing, and secure delivery with automated retries.

---

##  Table of Contents
* [Overview](#-overview)
* [Tech Stack](#-tech-stack)
* [Architecture](#-architecture)
* [Project Structure](#-project-structure)
* [Getting Started](#-getting-started)
* [API Documentation](#-api-documentation)
* [Signature Verification](#-signature-verification)
* [Retry Strategy](#-retry-strategy)

---

##  Overview
This platform acts as a secure bridge between external services and customer servers. It ensures that incoming events are verified, logged, and delivered reliably without blocking the main API thread.

**Key capabilities:**
* **Asynchronous Processing:** Offloads delivery tasks to background workers.
* **Security:** Implements HMAC SHA256 signature verification.
* **Fault Tolerance:** Robust retry logic via RabbitMQ.
* **Scalability:** Decoupled architecture allowing independent scaling of the API and Workers.

---

##  Tech Stack
* **Framework:** NestJS (Node.js)
* **Database:** MongoDB (Mongoose)
* **Message Broker:** RabbitMQ
* **Security:** JWT Authentication & HMAC SHA256
* **DevOps:** Docker (for RabbitMQ)
* **Communication:** Axios

---

##  Architecture
The system follows an event-driven flow to prevent slow callback URLs from impacting API performance.



1.  **Ingestion:** External Service posts an event to the Receiver API.
2.  **Persistence:** The event is stored in MongoDB with a `PENDING` status.
3.  **Queuing:** The API produces a message to RabbitMQ.
4.  **Delivery:** The Webhook Worker consumes the message and sends it to the customer’s `callbackUrl`.

---

##  Project Structure
```bash
src/
├── auth/           # JWT authentication (login/signup)
├── users/          # User management
├── webhooks/       # Subscriptions & callback management
├── events/         # Inbound event logging
├── rabbitmq/       # Message producer logic
├── worker/         # Background consumer & delivery logic
├── common/         # Auth guards & shared utilities
├── app.module.ts   # Main application module
└── main.ts         # Entry point (rawBody enabled for signatures)

- Significance

webhooks → manages user subscriptions

events → stores incoming webhook events

queue / worker → async processing

auth → isolates security concerns

common → shared reusable logic

🔹 Environment Setup

1. Clone the repository

git clone <backend-repo-url>
cd webhook-platform-backend

2. Install dependencies

npm install

3. Environment variables

Create a .env file:

MONGO_URI=mongodb://localhost:27017/webhooks
JWT_SECRET=supersecret
RABBITMQ_URL=amqp://localhost:5672
WEBHOOK_SIGNING_SECRET=your_secret_key

🔹 Running RabbitMQ (Required)

Using Docker (recommended)

docker run -d \
  --hostname rabbitmq \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

🔹 Running the Backend
API Server

npm start

Worker (in a separate terminal)
npx ts-node src/worker/main.ts

⚠️ The worker is responsible for delivering webhook events and handling retries.

🔹 Authentication APIs

Signup

POST /auth/signup

{
  "email": "test@example.com",
  "password": "password123"
}

Login

POST /auth/login

Returns JWT token:

{
  "accessToken": "jwt-token"
}

Use this token in:

Authorization: Bearer <token>

🔹 Webhook APIs
Create Webhook

POST /webhooks

{
  "source": "order-service",
  "sourceUrl": "https://example.com",
  "callbackUrl": "https://client-server.com/webhook",
}

- List Webhooks

GET /webhooks

- Cancel Webhook

DELETE /webhooks/:id

🔹 Receiving Webhook Events (External Services)

POST /webhooks/:webhookId

Headers:

x-webhook-signature: <HMAC_SHA256_SIGNATURE>


Body:

{
  "message": an incoming event
}

🔹 Webhook Signature Verification

Each webhook has a shared secret

Signature is generated using:

HMAC_SHA256(secret, rawBody)


Prevents payload tampering

Uses raw body verification

🔹 Retry Strategy

Events start with status: PENDING

Worker attempts delivery

On failure:

Increments retryCount

Marks FAILED

Requeues message (max retries configurable)

On success:

Marks SUCCESS

🔹 Design Decisions

- Why RabbitMQ?

Reliable message delivery

Supports retries & backpressure

Prevents API blocking

- Why MongoDB?

Flexible schema for webhook payloads

Fast writes for event logging

- Why NestJS?

Modular architecture

Dependency injection

Production-ready structure

