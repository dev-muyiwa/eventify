# Eventify

Eventify is a robust event booking system designed for managing events, ticketing, and payments. Built with NestJS and Docker, Eventify offers a modern, scalable solution for event-based applications with integrated Swagger documentation and rate limiting.

## Features

- **Event Management:** Create, update, and manage events.
- **Ticket Booking:** Allows users to book tickets for events.
- **Payment Integration:** Handles payments in multiple currencies (NGN, CAD, EUR).
- **Role-Based Access Control (RBAC):** Admin section with different user roles.
- **Logging and Monitoring:** Integrated with Winston, Grafana, Loki, and Prometheus.
- **API Documentation:** Interactive API documentation using Swagger.
- **Rate Limiting:** Prevents abuse and ensures fair usage.
- **Dockerized Setup:** Easy deployment using Docker.

## Installation

### Using Docker

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/dev-muyiwa/eventify.git
    cd eventify
    ```

2. **Build and Run the Docker Containers:**

   Ensure Docker and Docker Compose are installed, then run:

    ```bash
    docker-compose up --build
    ```

3. **Access the Application:**

   The application will be available at `http://localhost:3000`.

4. **Swagger Documentation:**

   Access the API documentation at:

    ```
    http://localhost:3000/api/v1/docs
    ```

### Manual Installation

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/dev-muyiwa/eventify.git
    cd eventify
    ```

2. **Install Dependencies:**

    ```bash
    npm install
    ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root directory and add your configuration. You can use the `.env.example` file as a reference.

4. **Run Migrations:**

   Ensure your PostgreSQL database is set up, and run:

    ```bash
    npm run migrate
    ```

5. **Start the Application:**

    ```bash
    npm run start:dev
    ```

## Usage

### Swagger Documentation

Explore and test the API endpoints using Swagger at:

```
http://localhost:3000/api/v1/docs
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push the branch (`git push origin feature/YourFeature`).
5. Create a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Additional Information

- **Documentation:** Visit [Documentation Link](#) for more information.
- **Issues:** Report issues in the [Issues section](https://github.com/dev-muyiwa/eventify/issues).

---

Feel free to adjust any section or add more details as necessary!