import express, { Request, Response } from 'express';
import QRCode from 'qrcode';

const router = express.Router();

// Generate QR code for parking token
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { tokenId, location, spotNumber, pricePerHour } = req.body;
    
    if (tokenId === undefined) {
      return res.status(400).json({ error: 'tokenId is required' });
    }
    
    // Create data object for QR code
    const qrData = {
      tokenId,
      location: location || 'Unknown',
      spotNumber: spotNumber || 'N/A',
      pricePerHour: pricePerHour || '0',
      timestamp: Date.now(),
      type: 'parkchain-token'
    };
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({ 
      qrCode: qrCodeDataURL,
      data: qrData
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate QR code for reservation
router.post('/reservation', async (req: Request, res: Response) => {
  try {
    const { reservationId, tokenId, renter, startTime, endTime } = req.body;
    
    if (!reservationId) {
      return res.status(400).json({ error: 'reservationId is required' });
    }
    
    // Create reservation data for QR code
    const qrData = {
      reservationId,
      tokenId,
      renter,
      startTime,
      endTime,
      type: 'parkchain-reservation'
    };
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });
    
    res.json({ 
      qrCode: qrCodeDataURL,
      data: qrData
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

export default router;
