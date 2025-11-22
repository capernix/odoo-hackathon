"""
Database Models and Operations
Integrates scanner with StockMaster database schema
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from datetime import datetime
from typing import Optional, List, Dict
import enum
import logging
import os
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

# ==================== MODELS ====================

class Product(Base):
    """Product model"""
    __tablename__ = 'products'
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False, index=True)
    category = Column(String)
    unit_of_measure = Column(String)
    reorder_threshold = Column(Integer, default=10)
    barcode = Column(String, unique=True, index=True)  # QR/Barcode data
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    stock_levels = relationship("StockLevel", back_populates="product")
    movements = relationship("StockMovement", back_populates="product")


class Warehouse(Base):
    """Warehouse model"""
    __tablename__ = 'warehouses'
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    location = Column(String)
    type = Column(String)  # main, production, storage, transit
    barcode = Column(String, unique=True, index=True)  # Warehouse QR code
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    stock_levels = relationship("StockLevel", back_populates="warehouse")


class StockLevel(Base):
    """Stock level model"""
    __tablename__ = 'stock_levels'
    
    id = Column(String, primary_key=True)
    product_id = Column(String, ForeignKey('products.id'), nullable=False)
    warehouse_id = Column(String, ForeignKey('warehouses.id'), nullable=False)
    quantity = Column(Float, default=0)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    product = relationship("Product", back_populates="stock_levels")
    warehouse = relationship("Warehouse", back_populates="stock_levels")


class MovementType(str, enum.Enum):
    """Movement type enumeration"""
    RECEIPT = "receipt"
    DELIVERY = "delivery"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    SCAN_RECEIPT = "scan_receipt"  # New: Receipt via scanner
    SCAN_DELIVERY = "scan_delivery"  # New: Delivery via scanner


class StockMovement(Base):
    """Stock movement history"""
    __tablename__ = 'stock_movements'
    
    id = Column(String, primary_key=True)
    product_id = Column(String, ForeignKey('products.id'), nullable=False)
    warehouse_id = Column(String, ForeignKey('warehouses.id'))
    source_warehouse_id = Column(String)
    destination_warehouse_id = Column(String)
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Float, nullable=False)
    quantity_change = Column(Float, nullable=False)
    reason = Column(Text)
    scanned_by = Column(String)  # New: User who performed scan
    scanner_id = Column(String)  # New: Scanner/camera ID
    created_at = Column(DateTime, default=datetime.now)
    created_by = Column(String)
    
    # Relationships
    product = relationship("Product", back_populates="movements")


class ScanLog(Base):
    """Log of all scan events"""
    __tablename__ = 'scan_logs'
    
    id = Column(String, primary_key=True)
    barcode_data = Column(String, nullable=False, index=True)
    barcode_type = Column(String)  # QR_CODE, EAN13, etc.
    scanner_id = Column(String)
    camera_id = Column(Integer)
    scan_timestamp = Column(DateTime, default=datetime.now)
    action_taken = Column(String)  # receipt, delivery, lookup, etc.
    product_id = Column(String)
    warehouse_id = Column(String)
    quantity = Column(Float)
    success = Column(Integer, default=1)  # 1 = success, 0 = failed
    error_message = Column(Text)
    metadata = Column(Text)  # JSON string for additional data


# ==================== DATABASE OPERATIONS ====================

class DatabaseManager:
    """Manage database connections and operations"""
    
    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize database manager
        
        Args:
            database_url: SQLAlchemy database URL
                         If None, reads from DATABASE_URL env variable
        """
        self.database_url = database_url or os.getenv(
            'DATABASE_URL',
            'postgresql://user:password@localhost:5432/stockmaster'
        )
        
        self.engine = create_engine(self.database_url, echo=False)
        self.SessionLocal = sessionmaker(bind=self.engine)
        
        logger.info(f"Database manager initialized")
    
    def create_tables(self):
        """Create all tables"""
        Base.metadata.create_all(self.engine)
        logger.info("Database tables created")
    
    def get_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()
    
    def close(self):
        """Close database connection"""
        self.engine.dispose()


class ScannerDatabaseOperations:
    """Database operations specific to scanner functionality"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    def log_scan(
        self,
        barcode_data: str,
        barcode_type: str,
        scanner_id: str,
        camera_id: int,
        action_taken: str,
        product_id: Optional[str] = None,
        warehouse_id: Optional[str] = None,
        quantity: Optional[float] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> str:
        """
        Log a scan event
        
        Returns:
            Scan log ID
        """
        with self.db_manager.get_session() as session:
            import uuid
            
            scan_log = ScanLog(
                id=str(uuid.uuid4()),
                barcode_data=barcode_data,
                barcode_type=barcode_type,
                scanner_id=scanner_id,
                camera_id=camera_id,
                action_taken=action_taken,
                product_id=product_id,
                warehouse_id=warehouse_id,
                quantity=quantity,
                success=1 if success else 0,
                error_message=error_message
            )
            
            session.add(scan_log)
            session.commit()
            
            logger.info(f"Logged scan: {barcode_data} -> {action_taken}")
            return scan_log.id
    
    def find_product_by_barcode(self, barcode: str) -> Optional[Product]:
        """Find product by barcode/QR code"""
        with self.db_manager.get_session() as session:
            product = session.query(Product).filter(
                Product.barcode == barcode
            ).first()
            
            if product:
                # Detach from session
                session.expunge(product)
            
            return product
    
    def find_warehouse_by_barcode(self, barcode: str) -> Optional[Warehouse]:
        """Find warehouse by barcode/QR code"""
        with self.db_manager.get_session() as session:
            warehouse = session.query(Warehouse).filter(
                Warehouse.barcode == barcode
            ).first()
            
            if warehouse:
                session.expunge(warehouse)
            
            return warehouse
    
    def get_stock_level(self, product_id: str, warehouse_id: str) -> float:
        """Get current stock level"""
        with self.db_manager.get_session() as session:
            stock = session.query(StockLevel).filter(
                StockLevel.product_id == product_id,
                StockLevel.warehouse_id == warehouse_id
            ).first()
            
            return stock.quantity if stock else 0.0
    
    def update_stock(
        self,
        product_id: str,
        warehouse_id: str,
        quantity_change: float,
        movement_type: MovementType,
        reason: Optional[str] = None,
        scanned_by: Optional[str] = None,
        scanner_id: Optional[str] = None
    ) -> Dict:
        """
        Update stock level and create movement record
        
        Args:
            product_id: Product ID
            warehouse_id: Warehouse ID
            quantity_change: Positive for receipts, negative for deliveries
            movement_type: Type of movement
            reason: Reason for stock change
            scanned_by: User who scanned
            scanner_id: Scanner device ID
            
        Returns:
            Dictionary with old_qty, new_qty, movement_id
        """
        with self.db_manager.get_session() as session:
            import uuid
            
            # Get or create stock level
            stock = session.query(StockLevel).filter(
                StockLevel.product_id == product_id,
                StockLevel.warehouse_id == warehouse_id
            ).first()
            
            old_qty = 0.0
            
            if not stock:
                stock = StockLevel(
                    id=str(uuid.uuid4()),
                    product_id=product_id,
                    warehouse_id=warehouse_id,
                    quantity=0
                )
                session.add(stock)
            else:
                old_qty = stock.quantity
            
            # Update quantity
            new_qty = stock.quantity + quantity_change
            
            # Prevent negative stock
            if new_qty < 0:
                raise ValueError(f"Insufficient stock. Available: {stock.quantity}")
            
            stock.quantity = new_qty
            stock.last_updated = datetime.now()
            
            # Create movement record
            movement = StockMovement(
                id=str(uuid.uuid4()),
                product_id=product_id,
                warehouse_id=warehouse_id,
                movement_type=movement_type,
                quantity=abs(quantity_change),
                quantity_change=quantity_change,
                reason=reason,
                scanned_by=scanned_by,
                scanner_id=scanner_id
            )
            
            session.add(movement)
            session.commit()
            
            logger.info(
                f"Stock updated: {product_id} @ {warehouse_id} "
                f"{old_qty} -> {new_qty} ({quantity_change:+.2f})"
            )
            
            return {
                'old_quantity': old_qty,
                'new_quantity': new_qty,
                'quantity_change': quantity_change,
                'movement_id': movement.id
            }
    
    def process_receipt_scan(
        self,
        product_barcode: str,
        warehouse_barcode: str,
        quantity: float = 1.0,
        scanned_by: Optional[str] = None,
        scanner_id: Optional[str] = None
    ) -> Dict:
        """
        Process a receipt (incoming goods) via scanner
        
        Args:
            product_barcode: Product QR/barcode
            warehouse_barcode: Warehouse QR/barcode
            quantity: Quantity to receive
            scanned_by: User performing scan
            scanner_id: Scanner device ID
            
        Returns:
            Result dictionary with status and details
        """
        try:
            # Find product
            product = self.find_product_by_barcode(product_barcode)
            if not product:
                raise ValueError(f"Product not found: {product_barcode}")
            
            # Find warehouse
            warehouse = self.find_warehouse_by_barcode(warehouse_barcode)
            if not warehouse:
                raise ValueError(f"Warehouse not found: {warehouse_barcode}")
            
            # Update stock
            result = self.update_stock(
                product_id=product.id,
                warehouse_id=warehouse.id,
                quantity_change=quantity,
                movement_type=MovementType.SCAN_RECEIPT,
                reason=f"Scanned receipt: {product.name}",
                scanned_by=scanned_by,
                scanner_id=scanner_id
            )
            
            return {
                'success': True,
                'action': 'receipt',
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'sku': product.sku
                },
                'warehouse': {
                    'id': warehouse.id,
                    'name': warehouse.name
                },
                **result
            }
            
        except Exception as e:
            logger.error(f"Receipt scan error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_delivery_scan(
        self,
        product_barcode: str,
        warehouse_barcode: str,
        quantity: float = 1.0,
        scanned_by: Optional[str] = None,
        scanner_id: Optional[str] = None
    ) -> Dict:
        """
        Process a delivery (outgoing goods) via scanner
        """
        try:
            product = self.find_product_by_barcode(product_barcode)
            if not product:
                raise ValueError(f"Product not found: {product_barcode}")
            
            warehouse = self.find_warehouse_by_barcode(warehouse_barcode)
            if not warehouse:
                raise ValueError(f"Warehouse not found: {warehouse_barcode}")
            
            # Update stock (negative quantity for delivery)
            result = self.update_stock(
                product_id=product.id,
                warehouse_id=warehouse.id,
                quantity_change=-quantity,
                movement_type=MovementType.SCAN_DELIVERY,
                reason=f"Scanned delivery: {product.name}",
                scanned_by=scanned_by,
                scanner_id=scanner_id
            )
            
            return {
                'success': True,
                'action': 'delivery',
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'sku': product.sku
                },
                'warehouse': {
                    'id': warehouse.id,
                    'name': warehouse.name
                },
                **result
            }
            
        except Exception as e:
            logger.error(f"Delivery scan error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_scan_history(
        self,
        limit: int = 100,
        product_id: Optional[str] = None,
        warehouse_id: Optional[str] = None
    ) -> List[Dict]:
        """Get scan history"""
        with self.db_manager.get_session() as session:
            query = session.query(ScanLog).order_by(
                ScanLog.scan_timestamp.desc()
            )
            
            if product_id:
                query = query.filter(ScanLog.product_id == product_id)
            
            if warehouse_id:
                query = query.filter(ScanLog.warehouse_id == warehouse_id)
            
            logs = query.limit(limit).all()
            
            return [
                {
                    'id': log.id,
                    'barcode': log.barcode_data,
                    'type': log.barcode_type,
                    'action': log.action_taken,
                    'timestamp': log.scan_timestamp.isoformat(),
                    'success': bool(log.success),
                    'error': log.error_message
                }
                for log in logs
            ]


if __name__ == "__main__":
    # Demo: Database operations
    print("Database operations demo")
    
    # Initialize
    db_manager = DatabaseManager("sqlite:///stockmaster_test.db")
    db_manager.create_tables()
    
    # Create scanner operations
    scanner_ops = ScannerDatabaseOperations(db_manager)
    
    print("Database ready for scanner integration!")
