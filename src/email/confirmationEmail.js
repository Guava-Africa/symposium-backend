// Logo URLs - Use absolute URLs that work
// Since your images are returning 404, let's use the correct paths
// Your images are in the public folder, so they should be accessible at:
const ZIMCHINA_LOGO = 'https://zimchinasymposium.vercel.app/Zimchina.png';
const CHAMBER_LOGO = 'https://zimchinasymposium.vercel.app/chamberlogo.png';
const AFRICAPACITI_LOGO = 'https://zimchinasymposium.vercel.app/africapaciti.png';

// Base email wrapper
const getEmailWrapper = (content) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Registration Confirmation - Zimbabwe-China Investment Symposium</title>
  <style>
    /* Mobile responsive styles */
    @media only screen and (max-width: 480px) {
      .logo-img { height: 70px !important; }
      .header-text { font-size: 28px !important; }
      .sub-header-text { font-size: 16px !important; }
      .greeting-text { font-size: 18px !important; }
      .body-text { font-size: 15px !important; }
      .detail-label { font-size: 13px !important; }
      .detail-value { font-size: 17px !important; }
      .info-text { font-size: 15px !important; }
      .button-text { font-size: 15px !important; padding: 14px 28px !important; }
      .footer-text { font-size: 12px !important; }
      .card-padding { padding: 18px !important; }
      .section-padding { padding: 25px 18px !important; }
    }
    
    @media only screen and (max-width: 380px) {
      .logo-img { height: 50px !important; }
      .header-text { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0a1928; width: 100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #0a1928; width: 100%;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 24px; overflow: hidden;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Email content
const getEmailContent = (data) => `
  <!-- Hero Section -->
  <tr>
    <td style="background: #0a1928; padding: 35px 20px; text-align: center;" class="section-padding" bgcolor="#0a1928">
      <!-- Logos - Centered -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 10px 15px 10px;">
                  <img src="${ZIMCHINA_LOGO}" alt="Zimbabwe-China Symposium" class="logo-img" style="height: 90px; width: auto; display: block;">
                </td>
                <td style="padding: 0 10px 15px 10px;">
                  <img src="${AFRICAPACITI_LOGO}" alt="Africapaciti" class="logo-img" style="height: 90px; width: auto; display: block;">
                </td>
                <td style="padding: 0 10px 15px 10px;">
                  <img src="${CHAMBER_LOGO}" alt="Chamber of Chinese Enterprises" class="logo-img" style="height: 90px; width: auto; display: block;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <!-- HEADER - Using HIGHLY VISIBLE colors -->
      <div class="header-text" style="font-size: 38px; font-weight: 800; margin: 0 0 12px 0; line-height: 1.2; color: #ffffff; background: #0a1928; display: inline-block; padding: 0 20px; border-radius: 8px;">
        ✅ Registration Confirmed!
      </div>
      <div class="sub-header-text" style="font-size: 22px; font-weight: 600; margin: 0; color: #d4af37; background: #0a1928; display: inline-block; padding: 0 20px; border-radius: 8px;">
        Zimbabwe-China Investment Symposium 2026
      </div>
    </td>
  </tr>
  
  <!-- Content -->
  <tr>
    <td style="padding: 30px 25px; background: #ffffff;" class="section-padding">
      <div class="greeting-text" style="font-size: 22px; font-weight: 700; color: #0a1928; margin: 0 0 20px 0;">
        Dear ${data.title} ${data.fullName},
      </div>
      
      <div class="body-text" style="margin: 0 0 25px 0; line-height: 1.7; color: #333333; font-size: 17px;">
        Thank you for registering for the <strong>Zimbabwe-China Investment Symposium</strong>! We are thrilled to have you join us for this historic event.
      </div>
      
      <!-- Details Card -->
      <div style="background: #f8f9fa; border-radius: 16px; padding: 24px; margin: 0 0 25px 0; border: 1px solid #e5e7eb;" class="card-padding">
        <div style="margin-bottom: 16px;">
          <div class="detail-label" style="font-size: 15px; font-weight: 700; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Full Name</div>
          <div class="detail-value" style="font-size: 20px; font-weight: 700; color: #0a1928;">${data.title} ${data.fullName}</div>
        </div>
        <div style="margin-bottom: 16px;">
          <div class="detail-label" style="font-size: 15px; font-weight: 700; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Job Title</div>
          <div class="detail-value" style="font-size: 20px; font-weight: 700; color: #0a1928;">${data.jobTitle || 'Not specified'}</div>
        </div>
        <div style="margin-bottom: 16px;">
          <div class="detail-label" style="font-size: 15px; font-weight: 700; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Organization</div>
          <div class="detail-value" style="font-size: 20px; font-weight: 700; color: #0a1928;">${data.organization}</div>
        </div>
        <div>
          <div class="detail-label" style="font-size: 15px; font-weight: 700; color: #6b7280; margin-bottom: 4px; text-transform: uppercase;">Nationality</div>
          <div class="detail-value" style="font-size: 20px; font-weight: 700; color: #0a1928;">${data.nationality}</div>
        </div>
      </div>
      
      <!-- Info Section -->
      <div style="background: #f0f9ff; border-radius: 16px; padding: 22px; text-align: center; margin: 0 0 25px 0; border: 2px solid #d4af37;" class="card-padding">
        <div class="info-text" style="font-size: 17px; color: #1e3a5f; line-height: 1.8; font-weight: 500;">
          <strong style="font-size: 18px; color: #0a1928;">📌 IMPORTANT:</strong> Please present this email at the registration desk.<br><br>
          <strong>📅 Date:</strong> 2 July 2026<br>
          <strong>📍 Venue:</strong> Golden Conifer Conference Centre<br>
          <strong>📍 Address:</strong> 30 Quendon Rd, Harare, Zimbabwe<br>
          <strong>⏰ Time:</strong> 08:00 - 19:00
        </div>
      </div>
      
      <!-- Google Maps Link -->
      <div style="margin: 0 0 25px 0; text-align: center;">
        <a href="https://www.google.com/maps/search/?api=1&query=Golden+Conifer+Wedding+%26+Conference+Centre+30+Quendon+Rd+Harare" 
           style="display: inline-flex; align-items: center; gap: 10px; background: #d4af37; color: #0a1928; text-decoration: none; padding: 14px 24px; border-radius: 14px; font-weight: 700; font-size: 16px; border: 2px solid #0a1928;">
          <span style="font-size: 20px;">🗺️</span> 
          View on Google Maps
        </a>
      </div>
      
      <!-- Important Notice -->
      <div style="background: #fef2f2; border-left: 6px solid #dc2626; padding: 18px 20px; border-radius: 10px; margin: 0 0 25px 0;" class="card-padding">
        <div style="color: #991b1b; font-size: 17px; margin: 0 0 10px 0; font-weight: 700;">⚠️ What to bring:</div>
        <div style="color: #991b1b; font-size: 15px; margin: 0 0 6px 0; font-weight: 500;">• This confirmation email (digital or printed)</div>
        <div style="color: #991b1b; font-size: 15px; margin: 0 0 6px 0; font-weight: 500;">• Government-issued ID (passport or national ID)</div>
        <div style="color: #991b1b; font-size: 15px; margin: 0; font-weight: 500;">• Business cards for networking</div>
      </div>
      
      <!-- Button -->
      <div style="text-align: center;">
        <a href="https://zimchinasymposium.com/schedule" class="button-text" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 17px; box-shadow: 0 4px 12px rgba(220,38,38,0.3);">
          📋 View Full Schedule
        </a>
      </div>
    </td>
  </tr>
  
  <!-- Footer -->
  <tr>
    <td style="background: #f8f9fa; padding: 25px; text-align: center;" class="section-padding">
      <div class="footer-text" style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0;">© 2026 Zimbabwe-China Investment Symposium. All rights reserved.</div>
      <div class="footer-text" style="color: #6b7280; font-size: 13px; margin: 0;">Questions? <a href="mailto:registration@zimchinasymposium.com" style="color: #d4af37; text-decoration: none;">registration@zimchinasymposium.com</a></div>
    </td>
  </tr>
`;

// Main function to get email
export const getConfirmationEmail = (data) => {
  const content = getEmailContent(data);
  return getEmailWrapper(content);
};