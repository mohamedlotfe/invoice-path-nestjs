# BPMN Path Finder

This NestJS application fetches a BPMN diagram from a REST endpoint, constructs an in-memory graph of its flow nodes, and exposes an HTTP API to find a path between two nodes.


## Features

- ✅ Fetch and parse BPMN 2.0 XML via Camunda REST API
- ✅ Graph construction of flow nodes and sequence flows
- ✅ DFS-based path discovery between any two nodes
- ✅ Typed DTOs for success and error responses
- ✅ Dockerized deployment with Docker Compose
- ✅ Unit-tested service logic with Jest

## Prerequisites

- **Node.js** v18 or higher
- **npm** (v8+) or **yarn**
- Internet access to retrieve the BPMN XML


## Dependencies
- NestJS 10.x
- xios 1.x
- bpmn-moddle 5.x
- class-validator 0.14.x
- class-transformer 0.5.x
- rxjs 7.x
- Jest (bundled with NestJS)


## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/invoice-path-nestjs.git
cd invoice-path-nestjs

# Install dependencies
npm install
# or
yarn install
```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

Watches files and restarts server on changes. Defaults to http://localhost:3000.

### Production Build & Run

```bash
# Build
npm run build

# Start in production
npm run start:prod
```
### Using Docker:
   Build and run the Docker container using Docker Compose:

```bash
  docker-compose up --build
```


## API Usage

### Find Path Between Nodes

**Endpoint:**
```
GET /path?from={startNodeId}&to={endNodeId}
```

**Example:**
```
curl "http://localhost:3000/path?from=approveInvoice&to=invoiceProcessed"
```

**Response:**
```json
{
  "from": "approveInvoice",
  "to": "invoiceProcessed",
  "path": [
    "approveInvoice",
    "invoice_approved",
    "prepareBankTransfer",
    "ServiceTask_1",
    "invoiceProcessed"
  ]
}
```

## Error Handling

Structured error JSON with HTTP status codes:

- **400**: Bad request (missing/invalid params)
- **502**: Bad gateway (fetch failure)
- **404**: Path not found

Example:
```json
{
  "from": "approveInvoice",
  "to": "unknown",
  "error": "End node \"unknown\" not found"
}
```

## Project Structure

```text
invoice-path-nestjs/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   └── path/
│       ├── path.module.ts
│       ├── path.controller.ts
│       ├── path.service.ts
│       └── dto/
│           ├── find-path.dto.ts
│           ├── path-response.dto.ts
│           └── error-response.dto.ts
├── test/
│   └── path.service.spec.ts
├── Dockerfile
├── docker-compose.yml
└── README.md
```