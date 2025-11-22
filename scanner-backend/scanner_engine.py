"""
QR/Barcode Scanner Core Engine
Handles real-time camera feed, barcode detection, and decoding
"""

import cv2
import numpy as np
from pyzbar import pyzbar
from PIL import Image
from typing import Optional, List, Dict, Tuple
import logging
from datetime import datetime
from dataclasses import dataclass
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ScanResult:
    """Data class for scan results"""
    data: str
    type: str  # QR_CODE, CODE_128, EAN_13, etc.
    bbox: Tuple[int, int, int, int]  # x, y, width, height
    timestamp: datetime
    confidence: float = 1.0


class BarcodeScanner:
    """
    High-performance barcode/QR code scanner with real-time camera feed
    Supports multiple barcode formats simultaneously
    """
    
    def __init__(self, camera_id: int = 0, resolution: Tuple[int, int] = (1280, 720)):
        """
        Initialize scanner
        
        Args:
            camera_id: Camera device ID (0 for default webcam)
            resolution: Camera resolution (width, height)
        """
        self.camera_id = camera_id
        self.resolution = resolution
        self.cap = None
        self.is_running = False
        
        # Supported barcode types
        self.supported_types = [
            'QRCODE', 'CODE128', 'CODE39', 'EAN13', 'EAN8',
            'UPC_A', 'UPC_E', 'CODABAR', 'ITF', 'CODE93'
        ]
        
        logger.info(f"Scanner initialized with camera {camera_id}")
    
    def start_camera(self) -> bool:
        """Start camera capture"""
        try:
            self.cap = cv2.VideoCapture(self.camera_id)
            
            if not self.cap.isOpened():
                logger.error(f"Failed to open camera {self.camera_id}")
                return False
            
            # Set resolution
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
            
            # Enable autofocus if available
            self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
            
            self.is_running = True
            logger.info("Camera started successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error starting camera: {e}")
            return False
    
    def stop_camera(self):
        """Stop camera capture and release resources"""
        if self.cap:
            self.cap.release()
            self.is_running = False
            logger.info("Camera stopped")
    
    def scan_frame(self, frame: np.ndarray) -> List[ScanResult]:
        """
        Scan a single frame for barcodes/QR codes
        
        Args:
            frame: OpenCV frame (BGR format)
            
        Returns:
            List of ScanResult objects
        """
        results = []
        
        # Convert to grayscale for better detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive thresholding for better contrast
        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )
        
        # Decode barcodes from both original and processed images
        barcodes = pyzbar.decode(frame)
        barcodes_thresh = pyzbar.decode(thresh)
        
        # Combine results and remove duplicates
        all_barcodes = list({b.data: b for b in (barcodes + barcodes_thresh)}.values())
        
        for barcode in all_barcodes:
            # Extract barcode data
            data = barcode.data.decode('utf-8')
            barcode_type = barcode.type
            
            # Get bounding box
            rect = barcode.rect
            bbox = (rect.left, rect.top, rect.width, rect.height)
            
            # Create result
            result = ScanResult(
                data=data,
                type=barcode_type,
                bbox=bbox,
                timestamp=datetime.now(),
                confidence=1.0  # pyzbar doesn't provide confidence, always 1.0
            )
            
            results.append(result)
            logger.info(f"Detected {barcode_type}: {data}")
        
        return results
    
    def draw_results(self, frame: np.ndarray, results: List[ScanResult]) -> np.ndarray:
        """
        Draw bounding boxes and labels on frame
        
        Args:
            frame: OpenCV frame
            results: List of scan results
            
        Returns:
            Annotated frame
        """
        annotated = frame.copy()
        
        for result in results:
            x, y, w, h = result.bbox
            
            # Draw bounding box
            cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 255, 0), 3)
            
            # Prepare label
            label = f"{result.type}: {result.data}"
            
            # Calculate text size for background
            (text_width, text_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
            )
            
            # Draw background for text
            cv2.rectangle(
                annotated,
                (x, y - text_height - 10),
                (x + text_width, y),
                (0, 255, 0),
                -1
            )
            
            # Draw text
            cv2.putText(
                annotated,
                label,
                (x, y - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 0),
                2
            )
        
        return annotated
    
    def capture_and_scan(self) -> Tuple[Optional[np.ndarray], List[ScanResult]]:
        """
        Capture frame from camera and scan for barcodes
        
        Returns:
            Tuple of (frame, scan_results)
        """
        if not self.is_running or not self.cap:
            logger.warning("Camera not running")
            return None, []
        
        ret, frame = self.cap.read()
        
        if not ret:
            logger.error("Failed to capture frame")
            return None, []
        
        # Scan for barcodes
        results = self.scan_frame(frame)
        
        return frame, results
    
    def frame_to_base64(self, frame: np.ndarray, format: str = 'JPEG') -> str:
        """
        Convert OpenCV frame to base64 string for transmission
        
        Args:
            frame: OpenCV frame
            format: Image format (JPEG, PNG)
            
        Returns:
            Base64 encoded string
        """
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(rgb_frame)
        
        # Convert to bytes
        from io import BytesIO
        buffer = BytesIO()
        pil_image.save(buffer, format=format, quality=85)
        
        # Encode to base64
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/{format.lower()};base64,{img_str}"
    
    def scan_image_file(self, image_path: str) -> List[ScanResult]:
        """
        Scan a static image file for barcodes
        
        Args:
            image_path: Path to image file
            
        Returns:
            List of scan results
        """
        try:
            frame = cv2.imread(image_path)
            if frame is None:
                logger.error(f"Failed to load image: {image_path}")
                return []
            
            return self.scan_frame(frame)
            
        except Exception as e:
            logger.error(f"Error scanning image: {e}")
            return []
    
    def __enter__(self):
        """Context manager entry"""
        self.start_camera()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.stop_camera()


class MultiCameraScanner:
    """
    Manage multiple cameras simultaneously
    Useful for large warehouses with multiple scanning stations
    """
    
    def __init__(self, camera_ids: List[int] = [0]):
        """
        Initialize multiple scanners
        
        Args:
            camera_ids: List of camera IDs to use
        """
        self.scanners = {}
        for cam_id in camera_ids:
            self.scanners[cam_id] = BarcodeScanner(camera_id=cam_id)
    
    def start_all(self):
        """Start all cameras"""
        for cam_id, scanner in self.scanners.items():
            if scanner.start_camera():
                logger.info(f"Started camera {cam_id}")
            else:
                logger.error(f"Failed to start camera {cam_id}")
    
    def stop_all(self):
        """Stop all cameras"""
        for scanner in self.scanners.values():
            scanner.stop_camera()
    
    def scan_all(self) -> Dict[int, List[ScanResult]]:
        """
        Scan all cameras simultaneously
        
        Returns:
            Dictionary mapping camera_id to scan results
        """
        results = {}
        for cam_id, scanner in self.scanners.items():
            _, scan_results = scanner.capture_and_scan()
            results[cam_id] = scan_results
        
        return results


# Utility function for generating test QR codes
def generate_test_qr_codes(output_dir: str = "test_qrcodes"):
    """
    Generate sample QR codes for testing
    """
    import qrcode
    import os
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Sample product data
    test_products = [
        {"sku": "PROD-001", "name": "Steel Rods", "qty": 50},
        {"sku": "PROD-002", "name": "Chairs", "qty": 10},
        {"sku": "PROD-003", "name": "Desks", "qty": 5},
    ]
    
    for product in test_products:
        # Create QR code with JSON data
        import json
        qr_data = json.dumps(product)
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(f"{output_dir}/{product['sku']}.png")
        
        logger.info(f"Generated QR code for {product['sku']}")


if __name__ == "__main__":
    # Demo: Real-time scanning
    print("Starting barcode scanner demo...")
    print("Press 'q' to quit, 's' to save current frame")
    
    with BarcodeScanner() as scanner:
        while True:
            frame, results = scanner.capture_and_scan()
            
            if frame is None:
                break
            
            # Draw results on frame
            if results:
                frame = scanner.draw_results(frame, results)
                for result in results:
                    print(f"Scanned: {result.type} - {result.data}")
            
            # Display frame
            cv2.imshow("Barcode Scanner", frame)
            
            # Handle keyboard input
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s') and results:
                cv2.imwrite(f"scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg", frame)
                print("Frame saved!")
        
        cv2.destroyAllWindows()
