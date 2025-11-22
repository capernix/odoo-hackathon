# 🚀 Supabase Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Supabase Credentials

1. **Go to Supabase**: https://app.supabase.com
2. **Sign in or create account**
3. **Create a new project** or select existing one
4. **Get your credentials**:
   - Click on **Settings** (gear icon)
   - Go to **API** section
   - Copy:
     - `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` key → This is your `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Configure Environment Variables

1. **Open** `frontend/.env.local`
2. **Replace** placeholder values with your actual credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

### Step 3: Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  reorder_threshold INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses table
CREATE TABLE warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock table
CREATE TABLE stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

-- Ledger table (transaction history)
CREATE TABLE ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'receipt', 'delivery', 'transfer', 'adjustment'
  product_id UUID REFERENCES products(id),
  warehouse_from UUID REFERENCES warehouses(id),
  warehouse_to UUID REFERENCES warehouses(id),
  qty NUMERIC NOT NULL,
  user_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB
);

-- Create indexes for better performance
CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_stock_warehouse ON stock(warehouse_id);
CREATE INDEX idx_ledger_product ON ledger(product_id);
CREATE INDEX idx_ledger_created ON ledger(created_at DESC);
```

### Step 4: Create the change_stock Function

This is the core function that handles all stock changes:

```sql
CREATE OR REPLACE FUNCTION change_stock(
  p_type TEXT,
  p_product UUID,
  p_warehouse UUID,
  p_qty NUMERIC,
  p_user UUID DEFAULT NULL,
  p_note TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  v_current_qty NUMERIC;
  v_final_qty NUMERIC;
  v_warehouse_from UUID;
  v_warehouse_to UUID;
BEGIN
  -- Determine warehouse direction based on type
  IF p_type IN ('receipt', 'adjustment') THEN
    v_warehouse_to := p_warehouse;
    v_warehouse_from := NULL;
  ELSIF p_type = 'delivery' THEN
    v_warehouse_from := p_warehouse;
    v_warehouse_to := NULL;
  END IF;

  -- Get current stock or create if doesn't exist
  SELECT quantity INTO v_current_qty
  FROM stock
  WHERE product_id = p_product AND warehouse_id = p_warehouse;

  IF NOT FOUND THEN
    v_current_qty := 0;
    INSERT INTO stock (product_id, warehouse_id, quantity)
    VALUES (p_product, p_warehouse, 0);
  END IF;

  -- Calculate final quantity
  v_final_qty := v_current_qty + p_qty;

  -- Prevent negative stock
  IF v_final_qty < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'err', 'Insufficient stock. Available: ' || v_current_qty
    );
  END IF;

  -- Update stock
  UPDATE stock
  SET quantity = v_final_qty, updated_at = NOW()
  WHERE product_id = p_product AND warehouse_id = p_warehouse;

  -- Log transaction in ledger
  INSERT INTO ledger (type, product_id, warehouse_from, warehouse_to, qty, user_id, note)
  VALUES (p_type, p_product, v_warehouse_from, v_warehouse_to, p_qty, p_user, p_note);

  RETURN jsonb_build_object(
    'success', true,
    'final_qty', v_final_qty
  );
END;
$$ LANGUAGE plpgsql;
```

### Step 5: Add Sample Data (Optional)

```sql
-- Insert sample products
INSERT INTO products (name, sku, unit, reorder_threshold) VALUES
  ('Steel Rods 50kg', 'STEEL-ROD-50', 'kg', 20),
  ('Office Chair Executive', 'CHAIR-OFF-001', 'pcs', 5),
  ('Wooden Desk 120cm', 'DESK-WD-120', 'pcs', 3),
  ('HP Laptop i5 8GB', 'LAPTOP-HP-15', 'pcs', 2),
  ('White Paint 5L', 'PAINT-WHT-5L', 'liters', 10);

-- Insert sample warehouses
INSERT INTO warehouses (name, location) VALUES
  ('Main Warehouse', 'Building A, Ground Floor'),
  ('Production Floor', 'Building B, Floor 1'),
  ('Storage Rack A', 'Building A, Floor 2'),
  ('Storage Rack B', 'Building A, Floor 3');

-- Add some initial stock using the change_stock function
-- (Replace the UUIDs with actual IDs from your products and warehouses tables)
SELECT change_stock('receipt', 
  (SELECT id FROM products WHERE sku = 'STEEL-ROD-50'), 
  (SELECT id FROM warehouses WHERE name = 'Main Warehouse'), 
  100, 
  NULL, 
  'Initial stock'
);
```

### Step 6: Restart the Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 7: Verify

1. Open http://localhost:3001
2. Navigate to `/products` - Should load without errors
3. Navigate to `/warehouses` - Should load without errors
4. Navigate to `/dashboard` - Should show KPIs

---

## 🔧 Troubleshooting

**Error: "supabaseUrl is required"**
- ✅ Fixed! Check `.env.local` for correct credentials
- ✅ Restart dev server after changing env variables

**Error: "relation 'products' does not exist"**
- ❌ Run the SQL scripts in Step 3 to create tables

**Error: "function change_stock does not exist"**
- ❌ Run the SQL script in Step 4 to create the function

**Scanner not working?**
- ✅ Scanner backend needs to be running separately
- ✅ See `scanner-backend/README.md` for setup

---

## 📚 What You Have Now

✅ **Supabase Database** with proper schema
✅ **Frontend** connected to Supabase  
✅ **Stock management** with RPC functions
✅ **Transaction logging** in ledger table
✅ **Scanner integration** ready (when backend is running)

---

## 🎯 Next Steps

1. **Add team members** to your Supabase project (Settings → Team)
2. **Enable Row Level Security** for production (Settings → Authentication)
3. **Set up authentication** (already have login/signup pages!)
4. **Start the scanner backend** for QR code functionality

Happy coding! 🚀
