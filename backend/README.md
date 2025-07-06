# OptiSupport Backend

This is the backend server for OptiSupport, a ticket management system built with Node.js, Express, and Supabase.

## 🧱 Tech Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Supabase**: PostgreSQL database
- **JWT**: Authentication
- **OpenAI**: AI integration for ticket analysis
- **Webhooks**: For integrations with external systems

## 📁 Project Structure

```
/backend
├── /src
│   ├── /routes          # API route definitions
│   ├── /controllers     # Route controllers
│   ├── /services        # Business logic
│   ├── /middleware      # Express middleware
│   ├── /utils           # Utility functions
│   ├── supabaseClient.js # Supabase connection
│   └── server.js        # Express app setup
├── .env                 # Environment variables (not in repo)
├── .env.example         # Example environment variables
├── package.json         # Project dependencies
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account with a project set up

### Installation

1. Clone the repository
2. Navigate to the backend directory
   ```bash
   cd optisupport-new/backend
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Copy the example environment file and update with your credentials
   ```bash
   cp .env.example .env
   ```
5. Update the `.env` file with your environment variables

### Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

For webhook endpoints, use the API key:

```
X-API-Key: your_api_key
```

## 📬 API Endpoints

### Tickets

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/tickets` | Create a new ticket | Customer |
| GET | `/api/tickets` | Get all tickets (with filtering) | Agent, Admin |
| GET | `/api/tickets/:id` | Get a specific ticket | Customer, Agent, Admin |
| PATCH | `/api/tickets/:id/status` | Update ticket status | Agent, Admin |
| POST | `/api/tickets/:id/comment` | Add a comment to a ticket | Customer, Agent, Admin |

### Statistics

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/stats` | Get general ticket statistics | Agent, Admin |
| GET | `/api/stats/priority` | Get tickets by priority | Admin |

### Webhooks

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/webhooks/ticket/create` | Create a ticket via webhook | API Key |
| POST | `/api/webhooks/ticket/close` | Close a ticket via webhook | API Key |

## 🧠 AI Integration

The system uses OpenAI to analyze ticket urgency. Here's an example of the AI analysis:

### Example Request to AI Service

```javascript
const aiAnalysis = await analyzeUrgency(
  "My website is completely down and customers can't access it. This is urgent!"
);
```

### Example Response

```json
{
  "urgency": "high",
  "recommendation": "Assign to senior technical staff immediately. This is a critical outage affecting business operations."
}
```

## 🔄 Webhooks

### Outgoing Webhooks

The system sends webhook notifications for:
- New high priority tickets
- Tickets that haven't been updated in 72 hours

### Incoming Webhooks

The system can receive webhooks to:
- Create a new ticket
- Close an existing ticket

## 📊 Statistics Endpoint

Example response from the `/api/stats` endpoint:

```json
{
  "success": true,
  "data": {
    "open": 24,
    "closed": 58,
    "highPriority": 7,
    "avgResponseTime": "3h 42m"
  }
}
```

## 🧪 Testing

You can test the API endpoints using Postman or any other API testing tool. Import the Postman collection (if available) for ready-to-use API tests.

## 📝 Environment Variables

Make sure to set up the following environment variables in your `.env` file:

```
PORT=5000
SUPABASE_URL=YOUR_SUPABASE_URL_HERE
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY_HERE
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_EXPIRES_IN=24h
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
WEBHOOK_URL=YOUR_WEBHOOK_URL_HERE
API_KEY=YOUR_API_KEY_FOR_WEBHOOKS_HERE
```

## 📄 License

This project is licensed under the MIT License.
