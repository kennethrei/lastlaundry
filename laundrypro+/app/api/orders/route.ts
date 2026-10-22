import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailAdmin } from "@/lib/notify";
function safe(v: FormDataEntryValue | null, max=250){return String(v ?? "").trim().slice(0,max)}
export async function POST(req: Request) {
  const form = await req.formData();
  const customer_name=safe(form.get("customer_name"),100), phone=safe(form.get("phone"),20), address=safe(form.get("address"),250), service=safe(form.get("service"),60), pickup_date=safe(form.get("pickup_date"),10), pickup_window=safe(form.get("pickup_window"),60), notes=safe(form.get("notes"),500), estimated_kg=Number(form.get("estimated_kg")||3);
  if(customer_name.length<2 || !/^\+?[0-9 ()-]{7,20}$/.test(phone) || !address || !["Regular Wash","Wash and Fold","Delicate Care","Express Service"].includes(service) || !/^\d{4}-\d{2}-\d{2}$/.test(pickup_date) || !Number.isFinite(estimated_kg) || estimated_kg<0.5 || estimated_kg>100) return NextResponse.redirect(new URL("/order?error=invalid",req.url),303);
  const supabase=createAdminClient();
  const {data:order,error}=await supabase.from("orders").insert({customer_name,phone,address,service,pickup_date,pickup_window,notes,estimated_kg,status:"Pending",payment_status:"Unpaid"}).select("id,order_number").single();
  if(error || !order) { console.error(error); return NextResponse.redirect(new URL("/order?error=save_failed",req.url),303); }
  // Email is best-effort; dashboard notification is the saved order itself.
  await emailAdmin(`New LaundryPro order ${order.order_number}`,`<h2>New laundry order</h2><p><b>Order:</b> ${order.order_number}</p><p><b>Customer:</b> ${customer_name.replace(/[<>&"]/g,"")}</p><p><b>Phone:</b> ${phone}</p><p><b>Service:</b> ${service}</p><p><b>Pickup:</b> ${pickup_date} — ${pickup_window}</p><p>Open your LaundryPro admin dashboard to review this request.</p>`);
  return NextResponse.redirect(new URL(`/order/success?number=${encodeURIComponent(order.order_number)}`,req.url),303);
}