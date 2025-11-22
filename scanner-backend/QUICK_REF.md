# 🎯 Quick Reference - Scanner System

## 🚀 Quick Start Commands

```bash
# Setup (first time only)
cd scanner-backend
pip install -r requirements.txt
python setup.py

# Start server (every time)
python api.py
```

**Server runs at:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

---

## 📁 File Structure

```
scanner-backend/
├── api.py                 # FastAPI server (START THIS)
├── scanner_engine.py      # Camera & barcode detection
├── database.py           # Database models & operations
├── generate_qr.py        # QR code generator
├── setup.py              # One-time setup script
├── requirements.txt      # Python dependencies
├── .env.example          # Config template
├── README.md             # Full documentation
├── INTEGRATION.md        # Frontend integration guide
└── demo_qr_codes/        # Generated QR codes (after setup)
    ├── product_*.png
    └── warehouse_*.png
```

---

## 🎮 Main API Endpoints

### Scanner Control
- `POST /scanner/start` - Start camera
- `GET /scanner/capture/{camera_id}` - Get frame + scan
- `POST /scanner/stop/{camera_id}` - Stop camera

### Stock Operations
- `POST /scan/receipt` - Receive items (add stock)
- `POST /scan/delivery` - Deliver items (remove stock)
- `GET /scan/lookup/{barcode}` - Lookup item info

### Live Streaming
- `WebSocket /ws/scanner/{camera_id}` - Real-time video

---

## 📊 Database Models

**Products:** name, sku, category, unit, barcode  
**Warehouses:** name, code, location, barcode  
**Stock Levels:** product_id, warehouse_id, quantity  
**Movements:** type, quantity, timestamp, scanned_by  
**Scan Logs:** audit trail for all scans

---

## 🎨 QR Code Data Format

**Product QR:**
```json
{
  "type": "product",
  "sku": "STEEL-ROD-50",
  "name": "Steel Rods 50kg"
}
```

**Warehouse QR:**
```json
{
  "type": "warehouse",
  "code": "WH-MAIN",
  "name": "Main Warehouse"
}
```

---

## 🔧 Testing Flow

1. **Generate QR codes:** `python generate_qr.py`
2. **Print codes:** From `demo_qr_codes/` folder
3. **Start API:** `python api.py`
4. **Test in browser:** http://localhost:8000/docs
5. **Try receipt scan:**
   - POST /scanner/start (camera_id: 0)
   - Point at product QR → GET /scanner/capture/0
   - Point at warehouse QR → GET /scanner/capture/0
   - POST /scan/receipt with both barcodes

---

## 🎬 Demo Products & Warehouses

**Products:**
- Steel Rods 50kg (STEEL-ROD-50)
- Office Chair Executive (CHAIR-OFF-001)
- Wooden Desk 120cm (DESK-WD-120)
- HP Laptop i5 8GB (LAPTOP-HP-15)
- White Paint 5L (PAINT-WHT-5L)

**Warehouses:**
- Main Warehouse (WH-MAIN)
- Production Floor (WH-PROD)
- Storage Rack A (WH-STOR-A)
- Storage Rack B (WH-STOR-B)

---

## 🔌 Frontend Integration

**When ready to integrate:**

1. Copy hook: `hooks/useScanner.ts` (from INTEGRATION.md)
2. Add API client: `scannerAPI` in `lib/api.ts`
3. Create page: `app/scanner/page.tsx`
4. Add to nav: Update Sidebar with Scanner link
5. Test end-to-end

**Total time: ~15 minutes**

See `INTEGRATION.md` for complete code!

---

## 💡 Pro Tips

- **Camera issues?** Check camera permissions
- **No detection?** Better lighting helps
- **Slow scanning?** Reduce resolution in /scanner/start
- **Multi-camera?** Each camera gets unique ID (0, 1, 2...)
- **Production?** Use environment variables from .env

---

## 🏆 Hackathon Demo Script

1. **Show problem:** Manual typing is slow
2. **Start scanner:** Live camera feed
3. **Scan product QR:** Instant recognition
4. **Scan warehouse QR:** Location identified
5. **Click receive:** Stock updated in real-time
6. **Show dashboard:** Numbers update live
7. **Show history:** Complete audit trail

**Wow factor:** Camera feed + real-time updates!

---

## 📚 Documentation Files

- `README.md` - Complete system documentation
- `INTEGRATION.md` - Frontend integration guide (15 min)
- `QUICK_REF.md` - This file!
- `.env.example` - Configuration template

---

## 🎯 Key Features

✅ **Real-time scanning** - 10 FPS video stream  
✅ **Multi-format** - QR, EAN, Code128, and more  
✅ **Auto-detection** - Adaptive thresholding  
✅ **Database logging** - Complete audit trail  
✅ **WebSocket streaming** - Live camera feed  
✅ **REST API** - 12+ endpoints with docs  
✅ **Multi-camera** - Support for multiple stations  
✅ **Production-ready** - Error handling, reconnection  

---

## 🚀 Ready to Integrate!

**Everything is prepared for seamless integration when you say GO!**

Built with ❤️ for the Odoo Hackathon
