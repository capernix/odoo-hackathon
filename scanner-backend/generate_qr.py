"""
QR Code Generator for StockMaster
Generate QR codes for products and warehouses
"""

import qrcode
import json
import os
from typing import Dict, List
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QRCodeGenerator:
    """Generate QR codes for inventory items"""
    
    def __init__(self, output_dir: str = "qr_codes"):
        """
        Initialize QR code generator
        
        Args:
            output_dir: Directory to save QR codes
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True, parents=True)
    
    def generate_product_qr(
        self,
        product_id: str,
        sku: str,
        name: str,
        **kwargs
    ) -> str:
        """
        Generate QR code for a product
        
        Args:
            product_id: Unique product ID
            sku: Product SKU
            name: Product name
            **kwargs: Additional product data
            
        Returns:
            Path to generated QR code
        """
        # Create QR data as JSON
        qr_data = {
            "type": "product",
            "id": product_id,
            "sku": sku,
            "name": name,
            **kwargs
        }
        
        # Convert to JSON string
        data_string = json.dumps(qr_data)
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(data_string)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save
        filename = f"product_{sku}.png"
        filepath = self.output_dir / filename
        img.save(filepath)
        
        logger.info(f"Generated QR for product: {sku}")
        return str(filepath)
    
    def generate_warehouse_qr(
        self,
        warehouse_id: str,
        code: str,
        name: str,
        **kwargs
    ) -> str:
        """
        Generate QR code for a warehouse/location
        
        Args:
            warehouse_id: Unique warehouse ID
            code: Warehouse code
            name: Warehouse name
            **kwargs: Additional warehouse data
            
        Returns:
            Path to generated QR code
        """
        qr_data = {
            "type": "warehouse",
            "id": warehouse_id,
            "code": code,
            "name": name,
            **kwargs
        }
        
        data_string = json.dumps(qr_data)
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(data_string)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        filename = f"warehouse_{code}.png"
        filepath = self.output_dir / filename
        img.save(filepath)
        
        logger.info(f"Generated QR for warehouse: {code}")
        return str(filepath)
    
    def generate_batch_products(self, products: List[Dict]) -> List[str]:
        """
        Generate QR codes for multiple products
        
        Args:
            products: List of product dictionaries
            
        Returns:
            List of generated file paths
        """
        filepaths = []
        
        for product in products:
            filepath = self.generate_product_qr(**product)
            filepaths.append(filepath)
        
        logger.info(f"Generated {len(filepaths)} product QR codes")
        return filepaths
    
    def generate_batch_warehouses(self, warehouses: List[Dict]) -> List[str]:
        """
        Generate QR codes for multiple warehouses
        
        Args:
            warehouses: List of warehouse dictionaries
            
        Returns:
            List of generated file paths
        """
        filepaths = []
        
        for warehouse in warehouses:
            filepath = self.generate_warehouse_qr(**warehouse)
            filepaths.append(filepath)
        
        logger.info(f"Generated {len(filepaths)} warehouse QR codes")
        return filepaths
    
    def generate_demo_set(self) -> Dict[str, List[str]]:
        """
        Generate a complete demo set of QR codes
        
        Returns:
            Dictionary with product and warehouse QR code paths
        """
        # Demo products
        products = [
            {
                "product_id": "prod-001",
                "sku": "STEEL-ROD-50",
                "name": "Steel Rods 50kg",
                "category": "Raw Materials",
                "unit_of_measure": "kg"
            },
            {
                "product_id": "prod-002",
                "sku": "CHAIR-OFF-001",
                "name": "Office Chair Executive",
                "category": "Furniture",
                "unit_of_measure": "unit"
            },
            {
                "product_id": "prod-003",
                "sku": "DESK-WD-120",
                "name": "Wooden Desk 120cm",
                "category": "Furniture",
                "unit_of_measure": "unit"
            },
            {
                "product_id": "prod-004",
                "sku": "LAPTOP-HP-15",
                "name": "HP Laptop 15inch",
                "category": "Electronics",
                "unit_of_measure": "unit"
            },
            {
                "product_id": "prod-005",
                "sku": "PAINT-WHT-5L",
                "name": "White Paint 5L",
                "category": "Chemicals",
                "unit_of_measure": "liter"
            }
        ]
        
        # Demo warehouses
        warehouses = [
            {
                "warehouse_id": "wh-001",
                "code": "WH-MAIN",
                "name": "Main Warehouse",
                "location": "Building A",
                "type": "main"
            },
            {
                "warehouse_id": "wh-002",
                "code": "WH-PROD",
                "name": "Production Floor",
                "location": "Building B",
                "type": "production"
            },
            {
                "warehouse_id": "wh-003",
                "code": "WH-STOR-A",
                "name": "Storage Rack A",
                "location": "Building A - Section 1",
                "type": "storage"
            },
            {
                "warehouse_id": "wh-004",
                "code": "WH-STOR-B",
                "name": "Storage Rack B",
                "location": "Building A - Section 2",
                "type": "storage"
            }
        ]
        
        # Generate all QR codes
        product_paths = self.generate_batch_products(products)
        warehouse_paths = self.generate_batch_warehouses(warehouses)
        
        logger.info("=" * 60)
        logger.info("✅ Demo QR code set generated successfully!")
        logger.info(f"📦 Products: {len(product_paths)} QR codes")
        logger.info(f"🏭 Warehouses: {len(warehouse_paths)} QR codes")
        logger.info(f"📁 Location: {self.output_dir}")
        logger.info("=" * 60)
        
        return {
            "products": product_paths,
            "warehouses": warehouse_paths
        }
    
    def create_printable_sheet(
        self,
        qr_paths: List[str],
        output_file: str = "printable_qr_sheet.pdf"
    ):
        """
        Create a printable PDF sheet with multiple QR codes
        
        Args:
            qr_paths: List of QR code image paths
            output_file: Output PDF filename
        """
        try:
            from PIL import Image
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.pdfgen import canvas
            from reportlab.lib.units import inch
            
            # Create PDF
            pdf_path = self.output_dir / output_file
            c = canvas.Canvas(str(pdf_path), pagesize=A4)
            width, height = A4
            
            # Layout parameters
            qr_size = 2 * inch
            margin = 0.5 * inch
            cols = 3
            rows = 4
            
            x_spacing = (width - 2 * margin) / cols
            y_spacing = (height - 2 * margin) / rows
            
            page_num = 1
            idx = 0
            
            for qr_path in qr_paths:
                if idx >= cols * rows:
                    c.showPage()
                    idx = 0
                    page_num += 1
                
                row = idx // cols
                col = idx % cols
                
                x = margin + col * x_spacing + (x_spacing - qr_size) / 2
                y = height - margin - (row + 1) * y_spacing + (y_spacing - qr_size) / 2
                
                # Draw QR code
                c.drawImage(qr_path, x, y, qr_size, qr_size)
                
                # Draw label
                label = Path(qr_path).stem.replace('_', ' ').title()
                c.setFont("Helvetica", 8)
                c.drawCentredString(
                    x + qr_size / 2,
                    y - 12,
                    label
                )
                
                idx += 1
            
            c.save()
            logger.info(f"📄 Printable sheet created: {pdf_path}")
            
        except ImportError:
            logger.warning("reportlab not installed. Cannot create PDF sheet.")
            logger.info("Install with: pip install reportlab")


if __name__ == "__main__":
    print("=" * 60)
    print("🎨 StockMaster QR Code Generator")
    print("=" * 60)
    
    # Create generator
    generator = QRCodeGenerator(output_dir="demo_qr_codes")
    
    # Generate demo set
    result = generator.generate_demo_set()
    
    print("\n✨ QR codes generated and ready for demo!")
    print("\n📋 Next steps:")
    print("1. Print the QR codes or display them on screen")
    print("2. Start the scanner API: python api.py")
    print("3. Scan the QR codes with your camera!")
    print("\n" + "=" * 60)
