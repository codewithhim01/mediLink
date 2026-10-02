import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './server/config/index.js';
import { initSockets } from './server/sockets/queueSocket.js';

// Routers
import { authRouter } from './server/routes/authRoutes.js';
import { doctorRouter } from './server/routes/doctorRoutes.js';
import { clinicRouter } from './server/routes/clinicRoutes.js';
import { labRouter } from './server/routes/labRoutes.js';
import { appointmentRouter } from './server/routes/appointmentRoutes.js';
import { queueRouter } from './server/routes/queueRoutes.js';
import { referralRouter } from './server/routes/referralRoutes.js';
import { testBookingRouter } from './server/routes/testBookingRoutes.js';
import { reportRouter } from './server/routes/reportRoutes.js';
import { aiReportRouter } from './server/routes/aiReportRoutes.js';
import { reviewRouter } from './server/routes/reviewRoutes.js';
import { notificationRouter } from './server/routes/notificationRoutes.js';
import { adminRouter } from './server/routes/adminRoutes.js';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
  });

  initSockets(io);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Sample mock PDF report generator route for demonstration & downloads
  app.get('/uploads/:fileName', (req, res) => {
    const { fileName } = req.params;
    const filePath = path.join(uploadsDir, fileName);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // Serve valid mock PDF bytes if file doesn't exist on disk
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    const mockPdfContent = `%PDF-1.4
1 0 obj << /Title (MediLink Diagnostic Report) /Author (Precision Pathology) /Creator (MediLink Ecosystem) >> endobj
2 0 obj << /Type /Catalog /Pages 3 0 R >> endobj
3 0 obj << /Type /Pages /Kids [4 0 R] /Count 1 >> endobj
4 0 obj << /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >> endobj
5 0 obj << /Length 260 >> stream
BT
/F1 20 Tf 50 720 Td (MEDILINK CLINICAL LABORATORY REPORT) Tj
/F1 12 Tf 0 -40 Td (Patient: Johnathan Miller | Age: 38 | Sex: Male) Tj
0 -25 Td (Test: Advanced Lipid & Cardiovascular Panel) Tj
0 -25 Td (Total Cholesterol: 238 mg/dL [Reference: 125 - 200] HIGH) Tj
0 -25 Td (LDL Cholesterol: 154 mg/dL [Reference: < 100] HIGH) Tj
0 -25 Td (HDL Cholesterol: 54 mg/dL [Reference: > 40] NORMAL) Tj
0 -25 Td (hs-CRP: 2.8 mg/L [Reference: < 1.0] ELEVATED) Tj
0 -40 Td (Status: Validated by Pathologist Director) Tj
ET
endstream endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000115 00000 n 
0000000166 00000 n 
0000000229 00000 n 
0000000350 00000 n 
0000000665 00000 n 
trailer << /Size 7 /Root 2 0 R >>
startxref
738
%%EOF`;
    return res.send(Buffer.from(mockPdfContent));
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/doctors', doctorRouter);
  app.use('/api/clinics', clinicRouter);
  app.use('/api', labRouter); // handles /api/laboratories and /api/diagnostic-tests
  app.use('/api/appointments', appointmentRouter);
  app.use('/api/queues', queueRouter);
  app.use('/api/referrals', referralRouter);
  app.use('/api/test-bookings', testBookingRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/ai', aiReportRouter);
  app.use('/api/reviews', reviewRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/admin', adminRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'MediLink Healthcare Ecosystem',
      timestamp: new Date().toISOString(),
      geminiConfigured: !!config.geminiApiKey
    });
  });

  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = config.port;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediLink Server] Live and running on http://0.0.0.0:${PORT}`);
    console.log(`[MediLink Server] Mode: ${isDev ? 'Development (Vite Mounted)' : 'Production'}`);
    console.log(`[MediLink Server] Gemini API Key attached: ${config.geminiApiKey ? 'YES' : 'NO (Using deterministic mock provider)'}`);
  });
}

startServer().catch((err) => {
  console.error('[MediLink Server] Fatal start failure:', err);
  process.exit(1);
});
