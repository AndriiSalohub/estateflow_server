# EstateFlow Server

Welcome to the **EstateFlow Server** repository! This is the backend component of **EstateFlow**, an AI-powered real estate platform that facilitates property searches, rentals, and purchases. The server handles API requests, database operations, and third-party integrations, providing a robust foundation for the EstateFlow Client.

## Table of Contents

- Overview
- Features
- Tech Stack
- API Documentation
- Contributing
- Links

## Overview

The EstateFlow Server powers the core functionality of the EstateFlow platform, enabling property listings, AI-driven recommendations, secure payments, and user authentication. Built with **Node.js**, **Express** and **TypeScript**, it uses **PostgreSQL** with **Drizzle ORM** for efficient data management. The server is deployed at https://server-rbdb.onrender.com and provides a RESTful API for the client.

## Features

- **Property Management**: Create, update, and delete property listings.
- **AI Integration**: Powers recommendations via the Gemini Developer API.
- **JWT-Based Authentication**: Implements secure user authentication using JSON Web Tokens (JWT), ensuring protected access to endpoints and role-based authorization for clients, sellers, agencies, moderators, and admins.
- **Google Auth Integration**: Supports seamless login via Google OAuth 2.0 using Google API Auth, allowing users to authenticate quickly and securely with their Google accounts.
- **Payment Processing**: Handles transactions using the PayPal REST API.
- **Property Statistics Generation**: Provides detailed analytics on properties and users enabling moderators to track performance.
- **Role-Based Access**: Supports multiple user roles with granular access control.

## Tech Stack

- **Runtime**: Node.js for server-side execution
- **Framework**: Express.js for RESTful API
- **ORM**: Drizzle ORM for PostgreSQL interactions
- **Database**: PostgreSQL for data storage
- **Language**: TypeScript for type safety
- **APIs**:
  - Gemini Developer API for AI recommendations
  - Google API Auth for authentication
  - PayPal REST API for payments
- **Deployment**: Render for scaling
- **Version Control**: Git + GitHub

## API Documentation

Explore the RESTful API via Swagger at https://estateflow-server.onrender.com/api-docs/.

## Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a branch (`git checkout -b feat/your-feature`).
3. Commit changes (`git commit -m "feat: add feature"`).
4. Push to the branch (`git push origin feat/your-feature`).
5. Open a Pull Request.

Ensure code adheres to TypeScript conventions and includes tests.

## Links

- **API Documentation**: https://estateflow-server.onrender.com/api-docs/
- **Live Client**: https://estateflow-client.vercel.app/
- **Client Repository**: https://github.com/AndriiSalohub/estateflow_client
- **Report Issues**: https://github.com/AndriiSalohub/estateflow_server/issues
