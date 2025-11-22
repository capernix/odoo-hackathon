"""
FastAPI REST API for Scanner System
Provides real-time scanning, WebSocket streaming, and database integration
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import asyncio
import json
import base64
import cv2
import numpy as np
from datetime import datetime
import logging

from scanner_engine import BarcodeScanner, ScanResult
from database import DatabaseManager, ScannerDatabaseOperations, MovementType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="StockMaster Scanner API",
    description="Real-time QR/Barcode scanning with database integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
db_manager = DatabaseManager()
scanner_ops = ScannerDatabaseOperations(db_manager)

# Active scanners (camera_id -> scanner instance)
active_scanners: Dict[int, BarcodeScanner] = {}

# WebSocket connections
active_connections: List[WebSocket] = []


# ==================== PYDANTIC MODELS ====================

class ScanRequest(BaseModel):
    """Request model for manual scan"""
    barcode: str
    barcode_type: str = "MANUAL"
    action: str  # receipt, delivery, lookup
    warehouse_barcode: Optional[str] = None
    quantity: float = 1.0
    scanned_by: Optional[str] = None


class ReceiptRequest(BaseModel):
    """Receipt scan request"""
    product_barcode: str
    warehouse_barcode: str
    quantity: float = 1.0
    scanned_by: Optional[str] = "scanner_user"
    scanner_id: Optional[str] = "web_scanner"


class DeliveryRequest(BaseModel):
    """Delivery scan request"""
    product_barcode: str
    warehouse_barcode: str
    quantity: float = 1.0
    scanned_by: Optional[str] = "scanner_user"
    scanner_id: Optional[str] = "web_scanner"


class ScannerConfig(BaseModel):
    """Scanner configuration"""
    camera_id: int = 0
    resolution_width: int = 1280
    resolution_height: int = 720


# ==================== API ENDPOINTS ====================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("StockMaster Scanner API starting...")
    # Create database tables if they don't exist
    db_manager.create_tables()
    logger.info("API ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down...")
    # Stop all active scanners
    for scanner in active_scanners.values():
        scanner.stop_camera()
    active_scanners.clear()


@app.get("/")
async def root():
    """API root"""
    return {
        "name": "StockMaster Scanner API",
        "version": "1.0.0",
        "status": "running",
        "active_scanners": len(active_scanners),
        "websocket_connections": len(active_connections)
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "scanners": list(active_scanners.keys())
    }


@app.post("/scanner/start")
async def start_scanner(config: ScannerConfig):
    """
    Start a scanner instance
    
    Args:
        config: Scanner configuration
        
    Returns:
        Status and scanner ID
    """
    camera_id = config.camera_id
    
    if camera_id in active_scanners:
        return {
            "success": False,
            "message": f"Scanner {camera_id} already running"
        }
    
    try:
        scanner = BarcodeScanner(
            camera_id=camera_id,
            resolution=(config.resolution_width, config.resolution_height)
        )
        
        if scanner.start_camera():
            active_scanners[camera_id] = scanner
            logger.info(f"Started scanner {camera_id}")
            
            return {
                "success": True,
                "camera_id": camera_id,
                "message": f"Scanner {camera_id} started successfully"
            }
        else:
            return {
                "success": False,
                "message": f"Failed to start camera {camera_id}"
            }
            
    except Exception as e:
        logger.error(f"Error starting scanner: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/scanner/stop/{camera_id}")
async def stop_scanner(camera_id: int):
    """Stop a scanner instance"""
    if camera_id not in active_scanners:
        raise HTTPException(status_code=404, detail=f"Scanner {camera_id} not found")
    
    scanner = active_scanners[camera_id]
    scanner.stop_camera()
    del active_scanners[camera_id]
    
    logger.info(f"Stopped scanner {camera_id}")
    
    return {
        "success": True,
        "message": f"Scanner {camera_id} stopped"
    }


@app.get("/scanner/capture/{camera_id}")
async def capture_frame(camera_id: int):
    """
    Capture a single frame and scan for barcodes
    
    Args:
        camera_id: Camera ID
        
    Returns:
        Base64 encoded image and scan results
    """
    if camera_id not in active_scanners:
        raise HTTPException(status_code=404, detail=f"Scanner {camera_id} not running")
    
    scanner = active_scanners[camera_id]
    frame, results = scanner.capture_and_scan()
    
    if frame is None:
        raise HTTPException(status_code=500, detail="Failed to capture frame")
    
    # Draw results on frame
    if results:
        frame = scanner.draw_results(frame, results)
    
    # Convert to base64
    img_base64 = scanner.frame_to_base64(frame)
    
    return {
        "image": img_base64,
        "results": [
            {
                "data": r.data,
                "type": r.type,
                "bbox": r.bbox,
                "timestamp": r.timestamp.isoformat()
            }
            for r in results
        ],
        "count": len(results)
    }


@app.post("/scan/receipt")
async def scan_receipt(request: ReceiptRequest):
    """
    Process a receipt (incoming goods) scan
    
    Args:
        request: Receipt scan request
        
    Returns:
        Stock update result
    """
    try:
        result = scanner_ops.process_receipt_scan(
            product_barcode=request.product_barcode,
            warehouse_barcode=request.warehouse_barcode,
            quantity=request.quantity,
            scanned_by=request.scanned_by,
            scanner_id=request.scanner_id
        )
        
        # Log the scan
        scanner_ops.log_scan(
            barcode_data=request.product_barcode,
            barcode_type="QR_CODE",
            scanner_id=request.scanner_id,
            camera_id=0,
            action_taken="receipt",
            product_id=result.get('product', {}).get('id'),
            warehouse_id=result.get('warehouse', {}).get('id'),
            quantity=request.quantity,
            success=result['success']
        )
        
        # Broadcast to WebSocket clients
        await broadcast_scan_result(result)
        
        return result
        
    except Exception as e:
        logger.error(f"Receipt scan error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/scan/delivery")
async def scan_delivery(request: DeliveryRequest):
    """
    Process a delivery (outgoing goods) scan
    
    Args:
        request: Delivery scan request
        
    Returns:
        Stock update result
    """
    try:
        result = scanner_ops.process_delivery_scan(
            product_barcode=request.product_barcode,
            warehouse_barcode=request.warehouse_barcode,
            quantity=request.quantity,
            scanned_by=request.scanned_by,
            scanner_id=request.scanner_id
        )
        
        # Log the scan
        scanner_ops.log_scan(
            barcode_data=request.product_barcode,
            barcode_type="QR_CODE",
            scanner_id=request.scanner_id,
            camera_id=0,
            action_taken="delivery",
            product_id=result.get('product', {}).get('id'),
            warehouse_id=result.get('warehouse', {}).get('id'),
            quantity=request.quantity,
            success=result['success']
        )
        
        # Broadcast to WebSocket clients
        await broadcast_scan_result(result)
        
        return result
        
    except Exception as e:
        logger.error(f"Delivery scan error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/scan/lookup/{barcode}")
async def lookup_barcode(barcode: str):
    """
    Look up product or warehouse by barcode
    
    Args:
        barcode: Barcode/QR code data
        
    Returns:
        Product or warehouse information
    """
    # Try to find product
    product = scanner_ops.find_product_by_barcode(barcode)
    if product:
        return {
            "type": "product",
            "data": {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "category": product.category,
                "unit_of_measure": product.unit_of_measure,
                "barcode": product.barcode
            }
        }
    
    # Try to find warehouse
    warehouse = scanner_ops.find_warehouse_by_barcode(barcode)
    if warehouse:
        return {
            "type": "warehouse",
            "data": {
                "id": warehouse.id,
                "name": warehouse.name,
                "code": warehouse.code,
                "location": warehouse.location,
                "barcode": warehouse.barcode
            }
        }
    
    raise HTTPException(status_code=404, detail="Barcode not found")


@app.get("/scan/history")
async def get_scan_history(
    limit: int = 100,
    product_id: Optional[str] = None,
    warehouse_id: Optional[str] = None
):
    """
    Get scan history
    
    Args:
        limit: Maximum number of records
        product_id: Filter by product ID
        warehouse_id: Filter by warehouse ID
        
    Returns:
        List of scan logs
    """
    history = scanner_ops.get_scan_history(
        limit=limit,
        product_id=product_id,
        warehouse_id=warehouse_id
    )
    
    return {
        "count": len(history),
        "history": history
    }


@app.post("/scan/image")
async def scan_uploaded_image(file: UploadFile = File(...)):
    """
    Scan an uploaded image for barcodes
    
    Args:
        file: Image file upload
        
    Returns:
        Scan results
    """
    try:
        # Read uploaded file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Scan the image
        scanner = BarcodeScanner()
        results = scanner.scan_frame(img)
        
        return {
            "success": True,
            "filename": file.filename,
            "results": [
                {
                    "data": r.data,
                    "type": r.type,
                    "bbox": r.bbox,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in results
            ],
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Image scan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WEBSOCKET ====================

async def broadcast_scan_result(data: Dict):
    """Broadcast scan result to all connected WebSocket clients"""
    if not active_connections:
        return
    
    message = json.dumps({
        "type": "scan_result",
        "data": data,
        "timestamp": datetime.now().isoformat()
    })
    
    # Send to all connections
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except Exception as e:
            logger.error(f"Error broadcasting to WebSocket: {e}")


@app.websocket("/ws/scanner/{camera_id}")
async def websocket_scanner(websocket: WebSocket, camera_id: int):
    """
    WebSocket endpoint for real-time scanner feed
    
    Streams live camera feed with barcode detection results
    """
    await websocket.accept()
    active_connections.append(websocket)
    
    logger.info(f"WebSocket connected for camera {camera_id}")
    
    try:
        # Ensure scanner is running
        if camera_id not in active_scanners:
            scanner = BarcodeScanner(camera_id=camera_id)
            if scanner.start_camera():
                active_scanners[camera_id] = scanner
            else:
                await websocket.send_json({
                    "error": f"Failed to start camera {camera_id}"
                })
                await websocket.close()
                return
        
        scanner = active_scanners[camera_id]
        
        # Stream frames
        while True:
            frame, results = scanner.capture_and_scan()
            
            if frame is None:
                await websocket.send_json({
                    "error": "Failed to capture frame"
                })
                break
            
            # Draw results
            if results:
                frame = scanner.draw_results(frame, results)
            
            # Convert to base64
            img_base64 = scanner.frame_to_base64(frame)
            
            # Send frame and results
            await websocket.send_json({
                "type": "frame",
                "image": img_base64,
                "results": [
                    {
                        "data": r.data,
                        "type": r.type,
                        "bbox": r.bbox,
                        "timestamp": r.timestamp.isoformat()
                    }
                    for r in results
                ],
                "timestamp": datetime.now().isoformat()
            })
            
            # Small delay to control frame rate
            await asyncio.sleep(0.1)  # ~10 FPS
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for camera {camera_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)


# ==================== RUN ====================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("🚀 StockMaster Scanner API")
    print("=" * 60)
    print("\n📡 Starting server at http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🔌 WebSocket: ws://localhost:8000/ws/scanner/0")
    print("\n" + "=" * 60 + "\n")
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
