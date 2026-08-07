import emailjs from '@emailjs/browser';

// Initialize EmailJS (already done in your code)
emailjs.init('UPWoo4jvsyb6jIU2N'); // Your public key

const SERVICE_ID = 'service_suvhk3j';
const CUSTOMER_TEMPLATE_ID = 'template_0lvlv55';   // Your customer template ID
const ADMIN_TEMPLATE_ID = 'template_u99g1nc';          // Your admin template ID
const ADMIN_EMAIL = 'elvreofficals@gmail.com';

export const sendOrderEmails = async (order) => {
  try {
    // 1. Send email to customer
    const customerParams = {
      order_id: order.id,
      order_date: order.order_date,
      order_time: order.order_time,
      customer_name: order.customer,
      customer_email: order.email,
      customer_phone: order.phone,
      customer_address: order.address,
      products: order.products,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      to_email: order.email,       // dynamic recipient
    };

    const customerResult = await emailjs.send(
      SERVICE_ID,
      CUSTOMER_TEMPLATE_ID,
      customerParams
    );

    // 2. Send email to admin
    const adminParams = {
      ...customerParams,
      to_email: ADMIN_EMAIL,
    };

    const adminResult = await emailjs.send(
      SERVICE_ID,
      ADMIN_TEMPLATE_ID,
      adminParams
    );

    console.log('✅ Order emails sent successfully');
    return { success: true, customer: customerResult, admin: adminResult };
  } catch (error) {
    console.error('❌ EmailJS error:', error);
    return { success: false, error: error.message || 'Failed to send emails' };
  }
};