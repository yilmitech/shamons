// @ts-nocheck
Deno.serve(async (req) => {
  const { record } = await req.json(); // the new order row

  const esc = (v: unknown) =>
    String(v ?? "-")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const items = (record.items ?? [])
    .map(
      (i: any) =>
        `<li>${esc(i.quantity)}x ${esc(i.name)}${
          i.detailLabel ? ` (${esc(i.detailLabel)})` : ""
        } – ₦${Number(i.subtotal ?? 0).toLocaleString()}</li>`
    )
    .join("");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from: "Shamon Orders <onboarding@resend.dev>",
      to: (Deno.env.get("ADMIN_EMAIL") ?? "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      subject: `New order: ${record.booking_code}`,
      html: `
        <h3>New order received</h3>
        <p><strong>Ref:</strong> ${esc(record.booking_code)}</p>
        <p><strong>Customer:</strong> ${esc(record.customer_name)}</p>
        <p><strong>Phone:</strong> ${esc(record.phone)}</p>
        <p><strong>Location:</strong> ${esc(record.delivery_or_pickup_location ?? record.address)}</p>
        <p><strong>Method:</strong> ${esc(record.fulfillment_method)}</p>
        <p><strong>Preferred date:</strong> ${esc(record.preferred_date)}</p>
        <p><strong>Payment:</strong> ${esc(record.payment_method)} (${esc(record.payment_status)})</p>
        <p><strong>Items:</strong></p>
        <ul>${items}</ul>
        <p><strong>Total:</strong> ₦${Number(record.total_amount).toLocaleString()}</p>
      `,
    }),
  });

  return new Response(await res.text(), { status: res.status });
});