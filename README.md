# Zebra FX9600 / FX6700 RFID Simulator

This project simulates the Zebra FX9600 and FX6700 RFID readers, providing a real-time stream of synthetic RFID tag reads. The simulation data is broadcasted over WebSocket and can optionally be sent to a webhook endpoint. A React frontend offers controls to configure the simulation and displays the incoming tag data in a table and as live JSON.

![Zebra RFID Reader](https://scantech-group.com/wp-content/uploads/2025/02/scantech-zebra-lecteurRFID-fx9600.png)

## Features

- Real-time RFID tag read simulation  
- Configurable number of tags per cycle and read interval  
- WebSocket endpoint broadcasting simulated tag reads  
- Optional webhook POST integration for external systems  
- React-based frontend for control and live data visualization  
- Displays last 50 tag reads in a tabular format  
- Ability to toggle data sources (MQTT/Webhook)

---

## Project Structure

- **Backend**: FastAPI server providing:
  - WebSocket endpoint (`/ws/tags`) for streaming tag data  
  - REST API endpoints to start (`/api/start_simulation`) and stop (`/api/stop_simulation`) the simulation  
  - Simulation logic implemented in `ZebraFX9600Simulator` class  
- **Frontend**: React app using Chakra UI for UI components and styling, allowing users to control the simulation and view live data.

---

## Getting Started

### Prerequisites

- Python 3.11+  
- Node.js and npm  

### Clone the Repository

Run the following commands in your terminal:

`bash
git clone https://github.com/medkhalilbk/zebra-system.git
cd zebra-system
`

 

---

### Backend Setup and Run

1. Create and activate a Python virtual environment (recommended):

On Linux/macOS:  
`bash
python -m venv venv
source venv/bin/activate
`

On Windows:  
`powershell
python -m venv venv
venv\Scripts\activate
`

2. Install required Python packages:

`bash
pip install fastapi uvicorn httpx
`

3. Run the FastAPI server:

`bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
`

The backend API will be accessible at `http://localhost:8000`.

---

### Frontend Setup and Run

1. Navigate to the frontend directory:

`bash
cd frontend
`

2. Install dependencies:

`bash
npm install
`

3. Start the frontend development server:

`bash
npm run dev
`

By default, the frontend runs on `http://localhost:5173`.

---

## Usage

1. Open the frontend UI in your web browser.  
2. Select one or both data sources:
   - **MQTT**: Receive simulated data via WebSocket.  
   - **Webhook**: Receive simulated data via HTTP POST requests. If enabled, provide a valid webhook URL.  
3. Configure the number of tags emitted per cycle and the interval in seconds.  
4. Click **Start** to begin the simulation.  
5. Observe the live table of tag reads and JSON payload viewer updating in real time.  
6. Click **Stop** to halt the simulation.

---

## API Endpoints

### Start Simulation

`POST /api/start_simulation`

Starts the tag read simulation with the specified parameters.

**Request Body Example:**

`json
{
  "tag_count": 5,
  "interval": 1.0,
  "webhook_url": "https://your-webhook-url.com"
}
`

- `tag_count`: Number of tags to simulate per cycle.  
- `interval`: Time interval in seconds between each simulation cycle.  
- `webhook_url` (optional): If provided, simulation data will be POSTed to this URL.

**Response Example:**

`json
{
  "status": "Simulation started"
}
`

---

### Stop Simulation

`POST /api/stop_simulation`

Stops the ongoing tag read simulation.

**Response Example:**

`json
{
  "status": "Simulation stopped"
}
`

---

### WebSocket Endpoint

`GET /ws/tags`

Clients can connect to this WebSocket endpoint to receive live JSON messages containing simulated tag reads.

**Example message:**

`json
{
  "tag_reads": [
    {
      "epc": "300833B2DDD9014000000000",
      "antennaPort": 1,
      "peakRssi": -45,
      "seenCount": 3,
      "channelIndex": 2,
      "timeStamp": "2025-07-03T15:00:00Z"
    }
  ]
}
`

---

## Simulator Overview

The `ZebraFX9600Simulator` generates synthetic RFID tag read data with the following behavior:

- Emits a configurable number of tags every configured interval.  
- Broadcasts generated tag data to all connected WebSocket clients.  
- Optionally sends the same data to a configured webhook URL via HTTP POST.  

---

## Notes

- The frontend is configured to connect to `http://localhost:8000` for API and WebSocket communications.  
- CORS is enabled on the backend for local development environments (`localhost`).  
- Use tools such as [RequestBin](https://requestbin.com/) to test webhook functionality.  

---

## License

This project is licensed under the MIT License.

---

## Contact

For any questions or suggestions, please open an issue or contact the repository maintainer.
