# Command and Control (C2) Server

A secure, web-based command and control server for managing remote clients with real-time monitoring, command execution, and screen streaming capabilities.

## Features

- 🔒 **Secure Authentication**: Role-based access control with password and API key authentication
- 🖥️ **Client Management**: Monitor connected clients with detailed system information
- 🔄 **Real-time Communication**: WebSocket-based messaging for instant command execution
- 📊 **Dashboard**: Visual overview of system status, client activities, and command history
- 📷 **Remote Viewing**: Request screenshots and stream client screens in real-time
- ⌨️ **Remote Control**: Send keyboard and mouse commands to clients
- 📝 **Activity Logging**: Track all client activities and command executions
- 🗄️ **Persistent Storage**: PostgreSQL database for reliable data persistence

## Tech Stack

- **Frontend**: React, TailwindCSS, React Query, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Realtime**: WebSockets (ws)
- **Authentication**: Session-based + API key
- **Encryption**: AES-256 for secure client communications

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/c2-server.git
   cd c2-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your database configuration:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/c2_server
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will be available at http://localhost:5000

### Default Login

- Username: `admin`
- Password: `admin`

**Important**: Change the default admin password after first login.

## Client Integration

Client applications need to implement the WebSocket protocol to connect to the C2 server. 

### Example Client Connection

```javascript
// Connect to the C2 server
const clientId = 'unique-client-id';
const socket = new WebSocket(`ws://your-server:5000/ws?clientId=${clientId}`);

// Handle server commands
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'executeCommand') {
    // Execute the command
    const result = executeCommand(message.command);
    
    // Send back the result
    socket.send(JSON.stringify({
      type: 'commandResult',
      commandId: message.commandId,
      output: result
    }));
  }
};
```

## Deployment

### Production Build

Build the application for production:

```bash
npm run build
```

The compiled files will be in the `dist` directory.

### Environment Variables

- `NODE_ENV`: Set to 'production' for production mode
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (generate a strong random value)

## Security Considerations

- The C2 server should be deployed on a secured network
- Use HTTPS in production environments
- Regularly update the admin password and API keys
- Monitor logs for suspicious activities
- Consider IP restrictions for admin access

## License

[MIT License](LICENSE)