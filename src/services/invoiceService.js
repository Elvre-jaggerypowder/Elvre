import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generateOrderInvoice = async (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Helper: format currency
      const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;

      // Generate invoice number
      const invoiceNumber = `ELV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // GST calculation
      const gstRate = 0.025;
      const subtotal = order.subtotal || 0;
      const discount = order.discount || 0;
      const shipping = order.shipping || 0;
      const taxableAmount = subtotal - discount;
      const cgst = taxableAmount * gstRate;
      const sgst = taxableAmount * gstRate;
      const total = taxableAmount + cgst + sgst + shipping;

      // Amount in words
      const amountInWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const convert = (n) => {
          if (n < 20) return ones[n];
          if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
          if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
          if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
          return 'Rupees ' + convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
        };
        return convert(Math.round(total)) + ' Only';
      };

      // Build the HTML invoice (using system fonts for reliability)
      const invoiceHTML = `
        <div id="invoice-sheet" style="
          width: 800px;
          min-height: 1100px;
          background: #FFFDF9;
          padding: 40px 35px 35px 35px;
          font-family: 'Times New Roman', Times, serif;
          color: #33210F;
          position: relative;
          box-shadow: 0 4px 24px rgba(90,58,34,0.12);
          overflow: hidden;
        ">
          <!-- Watermark texture -->
          <div style="position: absolute; inset: 0; opacity: 0.04; pointer-events: none; display: flex; align-items: center; justify-content: center; transform: rotate(-15deg); font-size: 60px; font-weight: bold; color: #8B5E3C; white-space: nowrap; letter-spacing: 10px;">
            ELVRE ELVRE ELVRE ELVRE ELVRE
          </div>

          <div style="position: relative; z-index: 1;">
            <!-- HEADER -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #33210F; margin-bottom: 22px;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${window.location.origin}/assets/ELVRElogo1.png" style="height:55px;" alt="ELVRE" />
                <div>
                  <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #5C6B47; font-weight: 600;">Pure &amp; Traditional Jaggery</div>
                  <div style="font-size: 12px; color: #8A7355; margin-top: 4px; line-height: 1.5;">
                    Elvre Foods · elvre.in<br>
                    officalelvre@gmail.com &nbsp;·&nbsp; GSTIN: 07XXXXX1234X1ZX
                  </div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-family: 'Times New Roman', serif; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: #B8792E; font-weight: 600;">Tax Invoice</div>
                <div style="font-family: 'Courier New', monospace; font-size: 20px; font-weight: 500; color: #33210F; margin-top: 4px;">${invoiceNumber}</div>
                <div style="font-size: 11px; color: #8A7355; margin-top: 8px; line-height: 1.6;">
                  Invoice Date: <b style="color:#33210F;">${today}</b><br>
                  Order ID: <b style="color:#33210F;">#${order.id}</b><br>
                  Payment: <b style="color:#33210F;">${order.paymentMethod || 'COD'}</b>
                </div>
              </div>
            </div>

            <!-- PARTIES -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin-bottom: 26px;">
              <div>
                <h4 style="font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; color: #B8792E; margin-bottom: 8px; font-weight: 600;">Billed To</h4>
                <p style="font-size: 12.5px; line-height: 1.65; margin:0;"><b>${order.customer}</b></p>
                <p style="font-size: 11.5px; color: #8A7355; margin:2px 0;">${order.address.replace(/,/g, '<br>')}</p>
                <p style="font-size: 11.5px; color: #8A7355; margin:2px 0;">${order.email}</p>
                <p style="font-size: 11.5px; color: #8A7355; margin:2px 0;">${order.phone ? '+91 ' + order.phone : ''}</p>
              </div>
              <div>
                <h4 style="font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; color: #B8792E; margin-bottom: 8px; font-weight: 600;">Shipped To</h4>
                <p style="font-size: 12.5px; line-height: 1.65; margin:0;"><b>${order.customer}</b></p>
                <p style="font-size: 11.5px; color: #8A7355; margin:2px 0;">${order.address.replace(/,/g, '<br>')}</p>
              </div>
              <div>
                <h4 style="font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; color: #B8792E; margin-bottom: 8px; font-weight: 600;">Sold By</h4>
                <p style="font-size: 12.5px; line-height: 1.65; margin:0;"><b>Elvre Foods</b></p>
                <p style="font-size: 11.5px; color: #8A7355; margin:2px 0;">Plot 9, Industrial Area, Phase II<br>Panipat, Haryana – 132103</p>
              </div>
            </div>

            <!-- ITEMS TABLE -->
            <table style="width:100%; border-collapse:collapse; margin-bottom:4px;">
              <thead>
                <tr>
                  <th style="text-align:left; font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:#FFFDF9; background:#33210F; padding:10px 12px; font-weight:600; width:44%;">Item</th>
                  <th style="text-align:left; font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:#FFFDF9; background:#33210F; padding:10px 12px; font-weight:600;">HSN</th>
                  <th style="text-align:center; font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:#FFFDF9; background:#33210F; padding:10px 12px; font-weight:600;">Qty</th>
                  <th style="text-align:right; font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:#FFFDF9; background:#33210F; padding:10px 12px; font-weight:600;">Rate</th>
                  <th style="text-align:right; font-size:10px; letter-spacing:1.2px; text-transform:uppercase; color:#FFFDF9; background:#33210F; padding:10px 12px; font-weight:600;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.products.map(p => `
                  <tr>
                    <td style="padding:12px 12px; font-size:12.5px; border-bottom:1px solid #E4D6C1; vertical-align:top;">
                      <div style="font-weight:600; color:#33210F;">${p.name}${p.variant ? ` (${p.variant})` : ''}</div>
                      <div style="font-size:11px; color:#8A7355; margin-top:2px;">${p.description || 'Unrefined, chemical-free'}</div>
                    </td>
                    <td style="padding:12px 12px; font-size:12.5px; border-bottom:1px solid #E4D6C1; vertical-align:top; text-align:center; font-family:'Courier New',monospace;">1701</td>
                    <td style="padding:12px 12px; font-size:12.5px; border-bottom:1px solid #E4D6C1; vertical-align:top; text-align:center;">${p.quantity}</td>
                    <td style="padding:12px 12px; font-size:12.5px; border-bottom:1px solid #E4D6C1; vertical-align:top; text-align:right; font-family:'Courier New',monospace;">${formatCurrency(p.price)}</td>
                    <td style="padding:12px 12px; font-size:12.5px; border-bottom:1px solid #E4D6C1; vertical-align:top; text-align:right; font-family:'Courier New',monospace;">${formatCurrency(p.price * p.quantity)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td colspan="5" style="border-bottom:2px solid #33210F;"></td>
                </tr>
              </tbody>
            </table>

            <!-- TOTALS -->
            <div style="display:flex; justify-content:flex-end; margin-top:14px;">
              <div style="width:270px;">
                <div style="display:flex; justify-content:space-between; font-size:12.5px; padding:6px 0; color:#5A3A22;">
                  <span>Subtotal</span>
                  <span style="font-family:'Courier New',monospace;">${formatCurrency(subtotal)}</span>
                </div>
                ${discount > 0 ? `
                  <div style="display:flex; justify-content:space-between; font-size:12.5px; padding:6px 0; color:#5A3A22;">
                    <span>Discount (WELCOME10)</span>
                    <span style="font-family:'Courier New',monospace;">−${formatCurrency(discount)}</span>
                  </div>
                ` : ''}
                <div style="display:flex; justify-content:space-between; font-size:12.5px; padding:6px 0; color:#5A3A22;">
                  <span>Shipping</span>
                  <span style="font-family:'Courier New',monospace;">${shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12.5px; padding:6px 0; color:#5A3A22;">
                  <span>CGST @ 2.5%</span>
                  <span style="font-family:'Courier New',monospace;">${formatCurrency(cgst)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12.5px; padding:6px 0; color:#5A3A22;">
                  <span>SGST @ 2.5%</span>
                  <span style="font-family:'Courier New',monospace;">${formatCurrency(sgst)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:8px; padding-top:12px; border-top:2px solid #33210F; font-family:'Times New Roman',serif; font-size:19px; font-weight:600; color:#33210F;">
                  <span>Total</span>
                  <span style="font-family:'Courier New',monospace; color:#B8792E;">${formatCurrency(total)}</span>
                </div>
                <div style="font-size:11px; color:#8A7355; margin-top:10px; text-align:right; font-style:italic;">${amountInWords(total)}</div>
              </div>
            </div>

            <!-- FOOTER -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:48px; padding-top:20px; border-top:1px solid #E4D6C1;">
              <div style="max-width:230px;">
                <div style="font-size:10px; letter-spacing:1.8px; text-transform:uppercase; color:#B8792E; margin-bottom:8px; font-weight:600;">Need Help?</div>
                <p style="font-size:11px; line-height:1.7; color:#8A7355; margin:0;">For returns, replacements or invoice queries, write to <b style="color:#5A3A22;">officalelvre@gmail.com</b> within 7 days of delivery.</p>
              </div>
              <div style="max-width:230px; text-align:right;">
                <div style="font-size:10px; letter-spacing:1.8px; text-transform:uppercase; color:#B8792E; margin-bottom:8px; font-weight:600;">Note</div>
                <p style="font-size:11px; line-height:1.7; color:#8A7355; margin:0;">This is a computer-generated invoice and does not require a physical signature.</p>
              </div>
              <div style="width:100px; height:100px; display:flex; align-items:center; justify-content:center;">
                <img src="${window.location.origin}/assets/ELVRElogo1.png" style="max-width:80px; opacity:0.6;" alt="ELVRE" />
              </div>
            </div>

            <div style="text-align:center; margin-top:34px; padding-top:18px; border-top:1px dashed #E4D6C1; font-family:'Times New Roman',serif; font-style:italic; font-size:13px; color:#5A3A22;">
              Dhanyavaad for choosing <span style="color:#B8792E; font-weight:600; font-style:normal;">Elvre</span> — asli meetha, asli vishwas.
            </div>
          </div>
        </div>
      `;

      // Create a temporary container and inject the HTML
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.zIndex = '-999';
      container.innerHTML = invoiceHTML;
      document.body.appendChild(container);

      // Wait for fonts/layout to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const sheetElement = container.firstElementChild;

      // Render to canvas
      const canvas = await html2canvas(sheetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFDF9',
        logging: false,
        width: 800,
        height: sheetElement.scrollHeight,
      });

      // Generate PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${order.id}.pdf`);
      document.body.removeChild(container);
      resolve({ success: true });
    } catch (error) {
      console.error('Invoice generation error:', error);
      reject({ success: false, error: error.message });
    }
  });
};