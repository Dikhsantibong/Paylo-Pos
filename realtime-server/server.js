const http = require('http');
const cors = require('cors');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(cors());
app.use(express.json());

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*', // In production, restrict this to the Laravel app domain
        methods: ['GET', 'POST'],
    },
});

// Socket connection handling
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Allow clients to join specific tenant/outlet rooms
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`[Socket] Client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

// --- API ENDPOINTS FOR LARAVEL ---

// Health check
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Realtime Server is running' });
});

// Broadcast New Order
app.post('/api/new-order', (req, res) => {
    try {
        const { tenant_id, data } = req.body;
        
        if (!tenant_id || !data) {
            return res.status(400).json({ error: 'Missing tenant_id or data' });
        }

        const room = `tenant_${tenant_id}`;
        io.to(room).emit('NEW_ORDER', data);
        
        console.log(`[API] Broadcasted NEW_ORDER to ${room}`);
        res.status(200).json({ success: true, message: 'Event broadcasted' });
    } catch (error) {
        console.error('[API] Error in /api/new-order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Broadcast Order Updated
app.post('/api/order-updated', (req, res) => {
    try {
        const { tenant_id, data } = req.body;
        
        if (!tenant_id || !data) {
            return res.status(400).json({ error: 'Missing tenant_id or data' });
        }

        const room = `tenant_${tenant_id}`;
        io.to(room).emit('ORDER_UPDATED', data);
        
        console.log(`[API] Broadcasted ORDER_UPDATED to ${room}`);
        res.status(200).json({ success: true, message: 'Event broadcasted' });
    } catch (error) {
        console.error('[API] Error in /api/order-updated:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Realtime Server running on port ${PORT}`);
    console.log(`=========================================`);
});
