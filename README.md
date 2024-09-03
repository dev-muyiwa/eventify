# Eventify

Eventify is a comprehensive event booking system designed to manage events, ticketing, and payments. Built with NestJS, Docker, and Knex, this system provides a modern, scalable solution for event management with integrated Swagger documentation and rate limiting.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Event Management**: Create, update, and manage events.
- **Ticket Booking**: Allow users to book tickets for events.
- **Payment Integration**: Handles payments in NGN using Paystack.
- **Role-Based Access Control (RBAC)**: Admin section with different user roles.
- **Logging and Monitoring**: Integrated with Winston, Grafana, Loki, and Prometheus.
- **API Documentation**: Interactive API documentation using Swagger.
- **Rate Limiting**: Ensures fair usage and prevents abuse.
- **Dockerized Setup**: Easy deployment using Docker.
- **SQL Query Building**: Utilizes Knex for efficient and flexible SQL query building.

## Installation

### Docker Installation

This is the easiest and fastest method to get Eventify running.

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/dev-muyiwa/eventify.git
    cd eventify
    ```
2. **Configure Environment Variables**:
   - Obtain your Paystack secret key from the Paystack developer dashboard.
   - Set up an [ngrok](https://ngrok.com/) account to obtain a static URL for webhooks.
   - Set the webhook URL to `{STATIC_URL}/api/v1/carts/verify-payment-webhook`.
   - Update the `.env.development` file with these details.
3. **Build and Run the Docker Containers**:
   Ensure Docker and Docker Compose are installed, then run:
    ```bash
    docker-compose up --build
    ```
4. **Access the Application**:
   The application will be available at the `STATIC_URL` you configured.

## Usage

### Swagger Documentation

Explore and test the API endpoints using Swagger at:
```bash
{STATIC_URL}/api/v1/docs
```

## Project Structure

- **src/**: Contains the source code, organized into modules.
- **migrations/**: Database migration files.
- **test/**: Unit and integration tests.
- **docker-compose.yml**: Docker configuration for the project.
- **prometheus-config.yml**: Configuration for Prometheus monitoring.
- **loki-config.yml**: Configuration for Loki logging.
- **promtail-config.yml**: Configuration for Promtail to collect logs.

## Technologies Used

- **NestJS**: Framework for building efficient, scalable Node.js server-side applications.
- **TypeScript**: Strongly typed programming language that builds on JavaScript.
- **Knex**: SQL query builder for flexible and efficient SQL queries.
- **PostgreSQL**: Relational database management system.
- **Docker**: Platform for developing, shipping, and running applications in containers.
- **Grafana**: Analytics and monitoring solution.
- **Loki**: Log aggregation system.
- **Prometheus**: Monitoring and alerting toolkit.

## Contributing

Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push the branch (`git push origin feature/YourFeature`).
5. Create a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.