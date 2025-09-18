import express from "express";
import db from "../db";
import { authMiddleware, AuthRequest } from "../auth/auth";
import moment from "moment";
import createCsvWriter from "csv-writer";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const router = express.Router();
router.use(authMiddleware);

// Generate sales report
router.get("/:restaurantId/reports/sales", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  const { type, start_date, end_date, format } = req.query;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  let startDate: string;
  let endDate: string;
  
  // Set date range based on report type
  switch (type) {
    case "daily":
      startDate = moment().startOf('day').toISOString();
      endDate = moment().endOf('day').toISOString();
      break;
    case "weekly":
      startDate = moment().startOf('week').toISOString();
      endDate = moment().endOf('week').toISOString();
      break;
    case "monthly":
      startDate = moment().startOf('month').toISOString();
      endDate = moment().endOf('month').toISOString();
      break;
    default:
      startDate = start_date as string || moment().startOf('day').toISOString();
      endDate = end_date as string || moment().endOf('day').toISOString();
  }
  
  // Get orders data
  const orders = await db("orders")
    .where({ restaurant_id: restaurantId })
    .whereBetween("created_at", [startDate, endDate])
    .where("status", "!=", "cancelled")
    .select("*");
  
  // Calculate summary statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_cents, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Group by order type
  const ordersByType = orders.reduce((acc: any, order) => {
    acc[order.order_type] = (acc[order.order_type] || 0) + 1;
    return acc;
  }, {});
  
  // Group by hour for daily reports
  const ordersByHour = orders.reduce((acc: any, order) => {
    const hour = moment(order.created_at).format('HH');
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  
  // Get menu items sales
  const menuItemsSales: any = {};
  orders.forEach(order => {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    items.forEach((item: any) => {
      if (!menuItemsSales[item.name]) {
        menuItemsSales[item.name] = {
          quantity: 0,
          revenue: 0
        };
      }
      menuItemsSales[item.name].quantity += item.quantity;
      menuItemsSales[item.name].revenue += item.price_cents * item.quantity;
    });
  });
  
  const reportData = {
    period: {
      start: startDate,
      end: endDate,
      type: type || 'custom'
    },
    summary: {
      total_orders: totalOrders,
      total_revenue_cents: totalRevenue,
      average_order_value_cents: Math.round(averageOrderValue)
    },
    orders_by_type: ordersByType,
    orders_by_hour: ordersByHour,
    menu_items_sales: menuItemsSales,
    orders: orders
  };
  
  if (format === 'csv') {
    return generateCSVReport(res, reportData, restaurantId as string);
  } else if (format === 'pdf') {
    return generatePDFReport(res, reportData, restaurantId as string);
  }
  
  res.json(reportData);
});

// Generate End of Day report
router.post("/:restaurantId/reports/eod", async (req: AuthRequest, res) => {
  const { restaurantId } = req.params;
  const { date } = req.body;
  
  if (req.user.role !== "super_admin" && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const reportDate = date || moment().format('YYYY-MM-DD');
  const startDate = moment(reportDate).startOf('day').toISOString();
  const endDate = moment(reportDate).endOf('day').toISOString();
  
  // Get today's orders
  const orders = await db("orders")
    .where({ restaurant_id: restaurantId })
    .whereBetween("created_at", [startDate, endDate])
    .where("status", "!=", "cancelled")
    .select("*");
  
  const reportData = {
    date: reportDate,
    total_orders: orders.length,
    total_revenue_cents: orders.reduce((sum, order) => sum + order.total_cents, 0),
    orders_by_type: orders.reduce((acc: any, order) => {
      acc[order.order_type] = (acc[order.order_type] || 0) + 1;
      return acc;
    }, {}),
    payment_methods: orders.reduce((acc: any, order) => {
      if (order.payment_method) {
        acc[order.payment_method] = (acc[order.payment_method] || 0) + 1;
      }
      return acc;
    }, {})
  };
  
  // Cache the report
  await db("sales_reports").insert({
    id: require("uuid").v4(),
    restaurant_id: restaurantId,
    report_type: "daily",
    report_date: reportDate,
    data: JSON.stringify(reportData)
  });
  
  res.json(reportData);
});

async function generateCSVReport(res: express.Response, data: any, restaurantId: string) {
  const filename = `sales-report-${restaurantId}-${Date.now()}.csv`;
  const filepath = path.join(__dirname, '../../uploads', filename);
  
  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: filepath,
    header: [
      { id: 'order_id', title: 'Order ID' },
      { id: 'order_number', title: 'Order Number' },
      { id: 'customer_name', title: 'Customer Name' },
      { id: 'order_type', title: 'Order Type' },
      { id: 'total_cents', title: 'Total (cents)' },
      { id: 'status', title: 'Status' },
      { id: 'created_at', title: 'Created At' }
    ]
  });
  
  await csvWriter.writeRecords(data.orders.map((order: any) => ({
    order_id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    order_type: order.order_type,
    total_cents: order.total_cents,
    status: order.status,
    created_at: order.created_at
  })));
  
  res.download(filepath, filename, (err) => {
    if (!err) {
      fs.unlinkSync(filepath); // Clean up file after download
    }
  });
}

async function generatePDFReport(res: express.Response, data: any, restaurantId: string) {
  const filename = `sales-report-${restaurantId}-${Date.now()}.pdf`;
  const filepath = path.join(__dirname, '../../uploads', filename);
  
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filepath));
  
  // Header
  doc.fontSize(20).text('Sales Report', 50, 50);
  doc.fontSize(12).text(`Period: ${data.period.start} to ${data.period.end}`, 50, 80);
  
  // Summary
  doc.fontSize(16).text('Summary', 50, 120);
  doc.fontSize(12)
     .text(`Total Orders: ${data.summary.total_orders}`, 50, 150)
     .text(`Total Revenue: $${(data.summary.total_revenue_cents / 100).toFixed(2)}`, 50, 170)
     .text(`Average Order Value: $${(data.summary.average_order_value_cents / 100).toFixed(2)}`, 50, 190);
  
  // Orders by Type
  doc.fontSize(16).text('Orders by Type', 50, 230);
  let yPosition = 260;
  Object.entries(data.orders_by_type).forEach(([type, count]) => {
    doc.fontSize(12).text(`${type}: ${count}`, 50, yPosition);
    yPosition += 20;
  });
  
  doc.end();
  
  doc.on('end', () => {
    res.download(filepath, filename, (err) => {
      if (!err) {
        fs.unlinkSync(filepath); // Clean up file after download
      }
    });
  });
}

export default router;
