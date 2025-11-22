#!/usr/bin/env python3
"""
Setup and initialization script for QR/Barcode Scanner System
This handles database creation, demo data loading, and system verification
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, Any

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine, SessionLocal, ScannerDatabaseOperations
from generate_qr import QRCodeGenerator


class ScannerSystemSetup:
    """Complete setup and initialization for scanner system"""
    
    def __init__(self):
        self.qr_generator = QRCodeGenerator()
        self.output_dir = Path("demo_qr_codes")
        
    def create_database(self) -> bool:
        """Create all database tables"""
        print("🔧 Creating database tables...")
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Database tables created successfully!")
            return True
        except Exception as e:
            print(f"❌ Error creating database: {e}")
            return False
    
    def load_demo_data(self) -> bool:
        """Load demo products and warehouses into database"""
        print("\n📦 Loading demo data...")
        
        try:
            db = SessionLocal()
            ops = ScannerDatabaseOperations(db)
            
            # Demo products
            demo_products = [
                {
                    "name": "Steel Rods 50kg",
                    "sku": "STEEL-ROD-50",
                    "category": "Raw Materials",
                    "unit_of_measure": "kg",
                    "reorder_threshold": 20
                },
                {
                    "name": "Office Chair Executive",
                    "sku": "CHAIR-OFF-001",
                    "category": "Furniture",
                    "unit_of_measure": "unit",
                    "reorder_threshold": 5
                },
                {
                    "name": "Wooden Desk 120cm",
                    "sku": "DESK-WD-120",
                    "category": "Furniture",
                    "unit_of_measure": "unit",
                    "reorder_threshold": 3
                },
                {
                    "name": "HP Laptop i5 8GB",
                    "sku": "LAPTOP-HP-15",
                    "category": "Electronics",
                    "unit_of_measure": "unit",
                    "reorder_threshold": 2
                },
                {
                    "name": "White Paint 5L",
                    "sku": "PAINT-WHT-5L",
                    "category": "Building Materials",
                    "unit_of_measure": "liters",
                    "reorder_threshold": 10
                }
            ]
            
            # Demo warehouses
            demo_warehouses = [
                {
                    "name": "Main Warehouse",
                    "code": "WH-MAIN",
                    "location": "Building A, Ground Floor",
                    "type": "main"
                },
                {
                    "name": "Production Floor",
                    "code": "WH-PROD",
                    "location": "Building B, Floor 1",
                    "type": "production"
                },
                {
                    "name": "Storage Rack A",
                    "code": "WH-STOR-A",
                    "location": "Building A, Floor 2",
                    "type": "storage"
                },
                {
                    "name": "Storage Rack B",
                    "code": "WH-STOR-B",
                    "location": "Building A, Floor 3",
                    "type": "storage"
                }
            ]
            
            # Create products
            created_products = []
            for product_data in demo_products:
                product = ops.create_product(**product_data)
                created_products.append(product)
                print(f"  ✓ Created product: {product.name} ({product.sku})")
            
            # Create warehouses
            created_warehouses = []
            for warehouse_data in demo_warehouses:
                warehouse = ops.create_warehouse(**warehouse_data)
                created_warehouses.append(warehouse)
                print(f"  ✓ Created warehouse: {warehouse.name} ({warehouse.code})")
            
            # Add some initial stock
            print("\n📊 Setting up initial stock levels...")
            stock_data = [
                (created_products[0].id, created_warehouses[0].id, 100),  # Steel Rods in Main
                (created_products[1].id, created_warehouses[0].id, 25),   # Chairs in Main
                (created_products[2].id, created_warehouses[1].id, 15),   # Desks in Production
                (created_products[3].id, created_warehouses[2].id, 8),    # Laptops in Storage A
                (created_products[4].id, created_warehouses[3].id, 50),   # Paint in Storage B
            ]
            
            for product_id, warehouse_id, quantity in stock_data:
                ops.update_stock(product_id, warehouse_id, quantity)
                product = next(p for p in created_products if p.id == product_id)
                warehouse = next(w for w in created_warehouses if w.id == warehouse_id)
                print(f"  ✓ Set stock: {product.sku} in {warehouse.code} = {quantity} units")
            
            db.commit()
            db.close()
            
            print("\n✅ Demo data loaded successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error loading demo data: {e}")
            return False
    
    def generate_qr_codes(self) -> bool:
        """Generate QR codes for all demo items"""
        print("\n🎨 Generating QR codes...")
        
        try:
            db = SessionLocal()
            ops = ScannerDatabaseOperations(db)
            
            # Get all products and warehouses
            from database import Product, Warehouse
            products = db.query(Product).all()
            warehouses = db.query(Warehouse).all()
            
            # Generate QR codes
            self.output_dir.mkdir(exist_ok=True)
            
            # Generate product QR codes
            print("\n  Products:")
            for product in products:
                qr_data = {
                    "type": "product",
                    "id": str(product.id),
                    "sku": product.sku,
                    "name": product.name,
                    "category": product.category,
                    "unit_of_measure": product.unit_of_measure
                }
                
                filename = f"product_{product.sku}.png"
                filepath = self.output_dir / filename
                
                self.qr_generator.generate_product_qr(
                    sku=product.sku,
                    name=product.name,
                    category=product.category,
                    output_path=str(filepath)
                )
                
                # Update barcode in database
                product.barcode = json.dumps(qr_data)
                print(f"  ✓ Generated: {filename}")
            
            # Generate warehouse QR codes
            print("\n  Warehouses:")
            for warehouse in warehouses:
                qr_data = {
                    "type": "warehouse",
                    "id": str(warehouse.id),
                    "code": warehouse.code,
                    "name": warehouse.name,
                    "location": warehouse.location,
                    "type": warehouse.type
                }
                
                filename = f"warehouse_{warehouse.code}.png"
                filepath = self.output_dir / filename
                
                self.qr_generator.generate_warehouse_qr(
                    code=warehouse.code,
                    name=warehouse.name,
                    location=warehouse.location,
                    output_path=str(filepath)
                )
                
                # Update barcode in database
                warehouse.barcode = json.dumps(qr_data)
                print(f"  ✓ Generated: {filename}")
            
            db.commit()
            db.close()
            
            print(f"\n✅ All QR codes saved to: {self.output_dir.absolute()}")
            return True
            
        except Exception as e:
            print(f"❌ Error generating QR codes: {e}")
            return False
    
    def verify_installation(self) -> bool:
        """Verify that everything is set up correctly"""
        print("\n🔍 Verifying installation...")
        
        checks = {
            "Database connection": False,
            "Products table": False,
            "Warehouses table": False,
            "Demo data": False,
            "QR codes": False,
        }
        
        try:
            db = SessionLocal()
            
            # Check database connection
            db.execute("SELECT 1")
            checks["Database connection"] = True
            
            # Check tables exist
            from database import Product, Warehouse, StockLevel
            
            products_count = db.query(Product).count()
            warehouses_count = db.query(Warehouse).count()
            stock_count = db.query(StockLevel).count()
            
            checks["Products table"] = products_count > 0
            checks["Warehouses table"] = warehouses_count > 0
            checks["Demo data"] = stock_count > 0
            
            # Check QR codes
            qr_files = list(self.output_dir.glob("*.png"))
            checks["QR codes"] = len(qr_files) >= 9  # 5 products + 4 warehouses
            
            db.close()
            
            # Print results
            print()
            all_good = True
            for check_name, status in checks.items():
                icon = "✅" if status else "❌"
                print(f"  {icon} {check_name}")
                if not status:
                    all_good = False
            
            if all_good:
                print("\n🎉 Installation verified successfully!")
                print("\n📋 Summary:")
                print(f"   • {products_count} products created")
                print(f"   • {warehouses_count} warehouses created")
                print(f"   • {stock_count} stock levels initialized")
                print(f"   • {len(qr_files)} QR codes generated")
                return True
            else:
                print("\n⚠️  Some checks failed. Please review the errors above.")
                return False
                
        except Exception as e:
            print(f"❌ Verification error: {e}")
            return False
    
    def print_next_steps(self):
        """Print next steps for the user"""
        print("\n" + "="*60)
        print("🚀 SETUP COMPLETE! Next Steps:")
        print("="*60)
        print()
        print("1️⃣  Start the API server:")
        print("   python api.py")
        print()
        print("2️⃣  Open the interactive API docs:")
        print("   http://localhost:8000/docs")
        print()
        print("3️⃣  Print your QR codes:")
        print(f"   Files are in: {self.output_dir.absolute()}")
        print()
        print("4️⃣  Test scanning:")
        print("   - Use /scanner/start to start camera")
        print("   - Point camera at printed QR codes")
        print("   - Use /scan/receipt to process items")
        print()
        print("5️⃣  Integrate with frontend (when ready):")
        print("   - Update NEXT_PUBLIC_API_BASE_URL=http://localhost:8000")
        print("   - Build scanner UI component")
        print("   - Connect WebSocket for live feed")
        print()
        print("📚 Full documentation: See README.md")
        print("="*60)
    
    def run(self):
        """Run complete setup process"""
        print("="*60)
        print("🎯 QR/Barcode Scanner System Setup")
        print("="*60)
        print()
        
        steps = [
            ("Creating database", self.create_database),
            ("Loading demo data", self.load_demo_data),
            ("Generating QR codes", self.generate_qr_codes),
            ("Verifying installation", self.verify_installation),
        ]
        
        for step_name, step_func in steps:
            if not step_func():
                print(f"\n❌ Setup failed at: {step_name}")
                print("Please fix the errors above and try again.")
                sys.exit(1)
        
        self.print_next_steps()


def main():
    """Main entry point"""
    setup = ScannerSystemSetup()
    setup.run()


if __name__ == "__main__":
    main()
