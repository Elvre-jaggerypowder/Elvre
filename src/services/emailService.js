import emailjs from '@emailjs/browser';

// ✅ Initialize EmailJS
const PUBLIC_KEY = 'UPWoo4jvsyb6jIU2N';
emailjs.init(PUBLIC_KEY);

console.log('✅ EmailJS initialized with key:', PUBLIC_KEY);

// ============================================
// 1. SEND ORDER CONFIRMATION TO CUSTOMER
// ============================================
export const sendOrderConfirmation = async (orderDetails) => {
  try {
    // ✅ Use checkout email if available, else use registered email
    const customerEmail = orderDetails.email || orderDetails.customer_email;
    
    console.log('📧 Sending order confirmation to customer:', customerEmail);
    console.log('📧 Order ID:', orderDetails.id);
    
    const trackingUrl = `${window.location.origin}/order-tracking/${orderDetails.id}`;
    
    const templateParams = {
      to_email: customerEmail,
      order_id: orderDetails.id,
      customer_name: orderDetails.customer,
      order_date: orderDetails.orderDate,
      order_time: orderDetails.orderTime,
      order_status: 'Confirmed',
      products: orderDetails.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        total: p.price * p.quantity
      })),
      total_amount: orderDetails.total,
      shipping_address: orderDetails.address,
      payment_method: orderDetails.paymentMethod,
      tracking_link: trackingUrl,
      reply_to: 'elvreofficals@gmail.com'
    };

    const result = await emailjs.send(
      'service_yeodtzt',
      'template_8xh9sqa',
      templateParams
    );
    
    console.log('✅ Customer email sent successfully to:', customerEmail);
    console.log('✅ EmailJS Response:', result);
    return { success: true };
  } catch (error) {
    console.error('❌ Customer email failed:', error);
    console.error('❌ Error details:', error.text || error);
    return { success: false, error };
  }
};

// ============================================
// 2. SEND ADMIN NOTIFICATION
// ============================================
export const sendAdminNotification = async (orderDetails) => {
  try {
    console.log('📧 Sending admin notification for order:', orderDetails.id);
    
    const templateParams = {
      to_email: 'elvreofficals@gmail.com',
      order_id: orderDetails.id,
      customer_name: orderDetails.customer,
      customer_email: orderDetails.email,
      customer_phone: orderDetails.phone,
      order_date: orderDetails.orderDate,
      order_time: orderDetails.orderTime,
      products: orderDetails.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        total: p.price * p.quantity
      })),
      total_amount: orderDetails.total,
      shipping_address: orderDetails.address,
      payment_method: orderDetails.paymentMethod,
      admin_link: `${window.location.origin}/admin-dashboard`
    };

    const result = await emailjs.send(
      'service_yeodtzt',
      'template_tspejv',
      templateParams
    );
    
    console.log('✅ Admin email sent successfully to: elvreofficals@gmail.com');
    console.log('✅ EmailJS Response:', result);
    return { success: true };
  } catch (error) {
    console.error('❌ Admin email failed:', error);
    console.error('❌ Error details:', error.text || error);
    return { success: false, error };
  }
};

// ============================================
// 3. SEND BOTH EMAILS
// ============================================
export const sendOrderEmails = async (orderDetails) => {
  try {
    console.log('📧 Sending both emails for order:', orderDetails.id);
    
    // Send customer email
    const customerResult = await sendOrderConfirmation(orderDetails);
    
    // Send admin email
    const adminResult = await sendAdminNotification(orderDetails);
    
    if (customerResult.success && adminResult.success) {
      console.log('✅ Both emails sent successfully');
      return { success: true };
    } else {
      console.log('⚠️ Some emails failed to send');
      return { success: false, customerResult, adminResult };
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error };
  }
};