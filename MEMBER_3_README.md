# StockMaster - Member 3 Module Documentation

## Internal Transfers, Adjustments & Stock Overview

This module implements the core inventory visibility and stock movement features for the StockMaster Inventory Management System.

---

## 📦 Features Implemented

### 1. **Stock Overview Page** (`/stock`)
- **Real-time inventory visibility** across all products and warehouses
- **Advanced filtering**:
  - Filter by warehouse
  - Filter by product
  - Search by product name or SKU
  - Low stock only filter
- **Statistics Dashboard**:
  - Total products count
  - Low stock items alert
  - Out of stock items
  - Total units across all warehouses
- **Stock Status Indicators**:
  - 🟢 In Stock
  - 🟡 Low Stock (below reorder threshold)
  - 🔴 Out of Stock
- **Responsive table** with product × warehouse matrix

### 2. **Internal Transfers Page** (`/transfers`)
- **Create warehouse-to-warehouse transfers**:
  - Source warehouse selection
  - Destination warehouse selection
  - Product selection with SKU display
  - Quantity input with validation
  - Available stock display
  - Optional notes field
- **Transfer validation**:
  - Prevents transfers to same warehouse
  - Validates sufficient stock availability
  - Ensures positive quantities
- **Transfer tracking**:
  - View all transfers with status
  - Filter by status (Draft, Waiting, Ready, Done, Cancelled)
  - Track transfer history
  - Cancel pending transfers
- **Statistics**:
  - Total transfers
  - Completed transfers
  - Pending transfers
  - Cancelled transfers

### 3. **Stock Adjustments Page** (`/adjustments`)
- **Cycle count adjustments**:
  - Product and warehouse selection
  - Current system quantity display
  - Counted quantity input
  - **Automatic variance calculation**:
    - Shows difference between counted and system qty
    - Displays variance percentage
    - Visual indicators (🟢 positive / 🔴 negative)
  - Mandatory reason field
- **Adjustment tracking**:
  - Complete history of all adjustments
  - View variance trends
  - Track who made adjustments and when
- **Statistics**:
  - Total adjustments
  - Positive variance count
  - Negative variance count
  - Total variance amount

### 4. **Dashboard** (`/dashboard`)
- **KPI Overview**:
  - Total products in inventory
  - Low stock alerts
  - Out of stock count
  - Pending transfers
- **Recent Activity**:
  - Recent transfers with status
  - Recent adjustments with variance
- **Quick Actions**:
  - New transfer
  - Stock adjustment
  - View stock overview

---

## 🗂️ Project Structure

```
frontend/
├── app/
│   ├── stock/
│   │   └── page.tsx           # Stock Overview Page
│   ├── transfers/
│   │   └── page.tsx           # Internal Transfers Page
│   ├── adjustments/
│   │   └── page.tsx           # Stock Adjustments Page
│   ├── dashboard/
│   │   └── page.tsx           # Main Dashboard
│   ├── page.tsx               # Home (redirects to dashboard)
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── Sidebar.tsx            # Navigation sidebar
│   ├── DashboardLayout.tsx    # Layout wrapper with sidebar
│   ├── Modal.tsx              # Reusable modal component
│   ├── Toast.tsx              # Toast notifications
│   ├── Button.tsx             # Button component with variants
│   ├── Input.tsx              # Form inputs (Input, Select, Textarea)
│   └── Loading.tsx            # Loading states
├── lib/
│   ├── api.ts                 # API client functions
│   └── utils.ts               # Utility functions
├── hooks/
│   └── useToast.ts            # Toast notification hook
└── types/
    └── index.ts               # TypeScript type definitions
```

---

## 🛠️ Technologies Used

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Lucide React** (Icons)
- **date-fns** (Date formatting)

---

## 📋 API Integration

### Expected Backend Endpoints

All pages integrate with the following API structure:

#### Products API
```typescript
GET    /api/products           // Get all products
GET    /api/products/:id       // Get single product
POST   /api/products           // Create product
PUT    /api/products/:id       // Update product
DELETE /api/products/:id       // Delete product
```

#### Warehouses API
```typescript
GET    /api/warehouses         // Get all warehouses
GET    /api/warehouses/:id     // Get single warehouse
POST   /api/warehouses         // Create warehouse
PUT    /api/warehouses/:id     // Update warehouse
DELETE /api/warehouses/:id     // Delete warehouse
```

#### Stock API
```typescript
GET    /api/stock                            // Get all stock levels
GET    /api/stock/product/:productId         // Get stock by product
GET    /api/stock/warehouse/:warehouseId     // Get stock by warehouse
GET    /api/stock/:productId/:warehouseId    // Get specific stock level
POST   /api/change-stock                     // Change stock (from Member 2)
```

#### Internal Transfers API
```typescript
GET    /api/transfers           // Get all transfers
GET    /api/transfers/:id       // Get single transfer
POST   /api/transfers           // Create transfer
POST   /api/transfers/:id/execute   // Execute transfer
POST   /api/transfers/:id/cancel    // Cancel transfer
```

#### Stock Adjustments API
```typescript
GET    /api/adjustments         // Get all adjustments
GET    /api/adjustments/:id     // Get single adjustment
POST   /api/adjustments         // Create adjustment
POST   /api/adjustments/:id/execute  // Execute adjustment
```

#### Movement History API
```typescript
GET    /api/movements                       // Get all movements
GET    /api/movements/product/:productId    // Get movements by product
GET    /api/movements/warehouse/:warehouseId // Get movements by warehouse
POST   /api/undo-last                       // Undo last operation (Member 4)
```

---

## 🔑 Key Components

### 1. **Modal Component**
Reusable modal with:
- Configurable sizes (sm, md, lg, xl)
- Close button with accessibility
- Backdrop with click-to-close
- Smooth animations

### 2. **Toast Notifications**
- Success, Error, Warning, Info variants
- Auto-dismiss with configurable duration
- Stack multiple toasts
- Slide-in animation

### 3. **Form Components**
- **Input**: Text, number, email inputs with labels and error states
- **Select**: Dropdown with options
- **Textarea**: Multi-line text input
- All support error messages and helper text

### 4. **Button Component**
Variants:
- Primary (blue)
- Secondary (gray)
- Outline (border)
- Danger (red)

States:
- Loading state with spinner
- Disabled state
- Sizes: sm, md, lg

---

## 🎨 Design System

### Color Palette
- **Primary**: Blue (`blue-600`)
- **Success**: Green (`green-600`)
- **Warning**: Yellow (`yellow-600`)
- **Danger**: Red (`red-600`)
- **Neutral**: Zinc (`zinc-50` to `zinc-950`)

### Dark Mode
All components fully support dark mode using Tailwind's `dark:` prefix.

### Responsive Design
- Mobile-first approach
- Sidebar collapses to hamburger menu on mobile
- Tables scroll horizontally on small screens
- Grid layouts adapt to screen size

---

## 🚀 Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

---

## 🔄 Integration with Other Members

### Dependencies on Member 1 (Products & Warehouses)
- Uses product list for dropdowns and displays
- Uses warehouse list for filters and transfers
- Relies on product attributes (SKU, reorder threshold)

### Dependencies on Member 2 (Stock Operations)
- Subscribes to stock changes for real-time updates
- Uses stock levels for validation
- Displays stock changes in movement history

### Provides to Member 4 (Dashboard & Audit)
- Transfer history for ledger
- Adjustment history for audit trail
- Stock movements for undo functionality

---

## 📊 Data Flow

```
User Action
    ↓
Frontend Validation
    ↓
API Request
    ↓
Backend (Odoo RPC)
    ↓
Database Update
    ↓
Response
    ↓
UI Update + Toast Notification
    ↓
Refresh Data
```

---

## ✅ Validation Rules

### Transfers
- ✅ Source ≠ Destination
- ✅ Quantity > 0
- ✅ Quantity ≤ Available Stock
- ✅ Product and warehouses required

### Adjustments
- ✅ Counted quantity ≥ 0
- ✅ Reason is mandatory
- ✅ Product and warehouse required
- ✅ Shows variance before submission

---

## 🎯 Future Enhancements (Optional)

1. **Real-time Updates** (Todo #5)
   - WebSocket connection for live stock updates
   - Auto-refresh on stock changes from other users
   - Live transfer status updates

2. **Bulk Operations**
   - Bulk transfers
   - Bulk adjustments
   - CSV import/export

3. **Advanced Filtering**
   - Date range filters
   - Category filters
   - Custom saved filters

4. **Reporting**
   - Stock movement reports
   - Variance analysis
   - Transfer efficiency metrics

---

## 🐛 Error Handling

All pages include:
- ✅ Try-catch blocks around API calls
- ✅ User-friendly error messages via toasts
- ✅ Loading states during data fetch
- ✅ Empty states when no data
- ✅ Form validation errors inline

---

## 🧪 Testing Checklist

- [x] Stock page loads and displays data
- [x] Filters work correctly
- [x] Transfer creation with validation
- [x] Transfer execution
- [x] Adjustment creation with variance calculation
- [x] Adjustment execution
- [x] Dashboard KPIs display correctly
- [x] Navigation between pages
- [x] Mobile responsive design
- [x] Dark mode support
- [ ] Real-time updates (pending backend integration)

---

## 📝 Notes for Team

### Environment Variables
Set in `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8069
```

### API Response Format
Expected format:
```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### TypeScript Types
All types are defined in `/types/index.ts` and can be imported:
```typescript
import { Product, Warehouse, StockLevel, InternalTransfer, StockAdjustment } from '@/types';
```

---

## 👥 Team Member 3 - Deliverables

✅ **Stock Overview Page** - Complete inventory visibility
✅ **Internal Transfers** - Full warehouse-to-warehouse movement workflow  
✅ **Stock Adjustments** - Cycle count reconciliation with variance tracking
✅ **Dashboard Integration** - KPIs and quick actions
✅ **Navigation System** - Sidebar with routing
✅ **Reusable Components** - Modal, Toast, Form components
✅ **API Integration** - Ready for backend connection
✅ **Responsive Design** - Mobile and desktop support
✅ **Dark Mode** - Full dark mode support

---

**Built with ❤️ for the Odoo Hackathon**
