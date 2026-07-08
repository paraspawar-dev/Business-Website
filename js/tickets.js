/**
 * ==========================================
 * TICKET.JS - CLIENT TICKET MODAL SYSTEM
 * ==========================================
 * This file controls the "Raise a Ticket" popup on the public website.
 * It follows the "Ponytail Method" - clean, organized, and highly commented.
 */

/**
 * [STEP 0] Dynamic Dependencies
 */
(function loadIntlTelInput() {
  if (typeof document === 'undefined' || document.getElementById('iti-css')) return;
  const css = document.createElement('link');
  css.id = 'iti-css';
  css.rel = 'stylesheet';
  css.href = 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/css/intlTelInput.css';
  document.head.appendChild(css);

  const js = document.createElement('script');
  js.src = 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/intlTelInput.min.js';
  document.head.appendChild(js);
})();

/**
 * [STEP 1] Open Ticket Modal
 * This function opens the modal and pre-fills any data passed to it.
 * @param {string} type - Service type (e.g., 'Repair')
 * @param {string} device - Device type (e.g., 'Laptop')
 * @param {string} desc - Initial description
 */
function openTicketModal(type = '', device = '', desc = '') {
  const modal = document.getElementById('ticket-modal');
  if (!modal) return; // Fail safely if modal doesn't exist on page
  
  // 1.1 Pre-fill form fields
  document.getElementById('ticket-type').value = type;
  document.getElementById('ticket-device').value = device;
  document.getElementById('ticket-desc').value = desc;
  
  // 1.2 Show form, hide success message (in case it was previously submitted)
  document.getElementById('ticket-form').style.display = 'block';
  document.getElementById('ticket-success').style.display = 'none';
  
  // 1.3 Add animation class and lock background scrolling
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // 1.4 Initialize intl-tel-input
  const phoneInput = document.getElementById('ticket-phone');
  if (phoneInput && window.intlTelInput && !window.iti) {
    window.iti = window.intlTelInput(phoneInput, {
      initialCountry: "in",
      separateDialCode: true,
      dropdownContainer: document.body,
      utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js",
    });
  }
}

/**
 * [STEP 2] Close Ticket Modal
 * This function closes the modal and restores background scrolling.
 */
function closeTicketModal() {
  document.getElementById('ticket-modal').classList.remove('open');
  document.body.style.overflow = ''; // Remove scroll lock
}

/**
 * [STEP 3] Submit Ticket to Backend
 * This async function handles the form submission, sending data to the server.
 */
async function submitTicket(e) {
  // 3.1 Prevent default form submission (page reload)
  e.preventDefault();
  
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  
  // 3.2 Show loading state on button to prevent double-clicks
  const originalText = btn.textContent;
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  // 3.3 Gather form data into an object
  const formData = new FormData(form);
  const payload = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    company: formData.get('company'),
    service_type: formData.get('type'),
    device: formData.get('device'),
    description: formData.get('description'),
    preferred_date: formData.get('date'),
    priority: formData.get('priority')
  };

  // 3.3.5 Validate and Format International Phone
  if (window.iti) {
    if (!window.iti.isValidNumber()) {
      alert("Please enter a valid phone number for the selected country.");
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }
    payload.phone = window.iti.getNumber(); // Get full international number (e.g., +91...)
  }

  try {
    // 3.4 Send POST request to backend API
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // 3.5 Parse the JSON response
    const data = await res.json();
    
    // 3.6 Handle success or error
    if (data.success) {
      // Hide form and show success confirmation
      form.style.display = 'none';
      const successDiv = document.getElementById('ticket-success');
      successDiv.style.display = 'block';
      
      // Display the generated Ticket ID from the server
      document.getElementById('ticket-id-display').textContent = data.data.ticket_id;
      
      // Clear the form fields for next time
      form.reset();
    } else {
      // Show error returned from server
      alert(data.error || 'Failed to submit ticket');
    }
  } catch (err) {
    // 3.7 Handle network errors
    console.error('API Error:', err);
    alert('Failed to connect to server. Please ensure the backend is running.');
  } finally {
    // 3.8 Restore button state regardless of outcome
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

/**
 * [STEP 4] Inject Modal HTML
 * This returns the raw HTML string for the ticket modal.
 * Used by main.js to inject the modal into the page dynamically.
 */
function getTicketModalHTML() {
  return `
    <div class="modal-overlay" id="ticket-modal" onclick="if((event || arguments[0]).target===this) closeTicketModal()">
      <div class="modal">
        <button class="modal-close" onclick="closeTicketModal()">×</button>
        <h2 style="margin-bottom: 1.5rem;" data-i18n="nav.ticket">Raise a Ticket</h2>
        
        <!-- Ticket Form -->
        <form id="ticket-form" onsubmit="submitTicket(event || arguments[0])">
          <div class="form-row">
            <div class="form-group"><label>Name *</label><input type="text" name="name" required></div>
            <div class="form-group"><label>Phone *</label><input type="tel" name="phone" id="ticket-phone" required style="width: 100%;"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Email</label><input type="email" name="email"></div>
            <div class="form-group"><label>Company (Optional)</label><input type="text" name="company" placeholder="Business Name"></div>
          </div>
          <div class="form-group"><label>Address / Location</label><input type="text" name="address" placeholder="Flat/Office No, Building, Street"></div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Service Type *</label>
              <select name="type" id="ticket-type" required>
                <option value="">Select...</option>
                <option value="Repair">Repair & Service</option>
                <option value="Sales Inquiry">Sales Inquiry</option>
                <option value="AMC">AMC Request</option>
                <option value="Networking">Networking & CCTV</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Device / Product</label>
              <select name="device" id="ticket-device">
                <option value="">Select...</option>
                <option value="Desktop PC">Desktop PC</option>
                <option value="Laptop">Laptop</option>
                <option value="MacBook">MacBook</option>
                <option value="Printer">Printer</option>
                <option value="CCTV System">CCTV System</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Description *</label>
            <textarea name="description" id="ticket-desc" rows="3" required></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group"><label>Preferred Date</label><input type="date" name="date"></div>
            <div class="form-group">
              <label>Priority</label>
              <select name="priority">
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Ticket</button>
        </form>
        
        <!-- Success Confirmation -->
        <div id="ticket-success" class="ticket-success" style="display: none;">
          <div class="checkmark">✓</div>
          <h3>Ticket Submitted!</h3>
          <p style="margin-top:0.5rem;color:var(--gray-600)">We will contact you shortly.</p>
          <div class="ticket-id" id="ticket-id-display"></div>
          <p><button class="btn btn-outline" onclick="closeTicketModal()">Close</button></p>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// TICKET TRACKING
// ----------------------------------------------------
window.handleTrackSubmit = async function(event) {
  event.preventDefault();
  
  const rawTicket = document.getElementById('track-ticket').value;
  const rawPhone = document.getElementById('track-phone').value;
  
  // Clean up inputs
  const ticketId = rawTicket.trim().toUpperCase();
  
  // Strip all non-digits (like +, spaces, dashes) and keep only the last 10 digits
  let phone = rawPhone.replace(/\D/g, '');
  if (phone.length > 10) {
    phone = phone.slice(-10);
  }
  
  const resultDiv = document.getElementById('track-result');
  const btn = document.getElementById('track-btn');
  
  if(!ticketId || !phone) return;
  
  btn.innerHTML = 'Checking...';
  btn.disabled = true;
  
  try {
    const res = await fetch(`/api/tickets/track?ticket_id=${encodeURIComponent(ticketId)}&phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    
    resultDiv.style.display = 'block';
    if(data.success) {
      const t = data.data;
      
      let statusColor = '#64748b'; // default gray
      if(t.status === 'New') statusColor = '#3b82f6'; // blue
      if(t.status === 'In Progress') statusColor = '#f59e0b'; // orange
      if(t.status === 'Resolved') statusColor = '#10b981'; // green
      
      resultDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem;">
          <div>
            <h3 style="margin: 0 0 0.25rem 0; font-size: 1.1rem; color: #0f172a;">${t.ticket_id}</h3>
            <span style="font-size: 0.85rem; color: #64748b;">${new Date(t.created_at).toLocaleDateString()}</span>
          </div>
          <span style="background: ${statusColor}15; color: ${statusColor}; padding: 0.35rem 0.75rem; border-radius: 99px; font-weight: 600; font-size: 0.85rem; border: 1px solid ${statusColor}30;">
            ${t.status}
          </span>
        </div>
        <div style="font-size: 0.95rem; line-height: 1.6; color: #475569;">
          <div><strong style="color: #1e293b;">Device:</strong> ${t.device || 'Not specified'}</div>
          <div><strong style="color: #1e293b;">Service:</strong> ${t.service_type}</div>
          <div><strong style="color: #1e293b;">Name:</strong> ${t.name}</div>
        </div>
      `;
      resultDiv.style.background = '#ffffff';
      resultDiv.style.borderColor = '#e2e8f0';
    } else {
      resultDiv.innerHTML = `<div style="color: #ef4444; font-weight: 500;">❌ ${data.error || 'Ticket not found'}</div>`;
      resultDiv.style.background = '#fef2f2';
      resultDiv.style.borderColor = '#fecaca';
    }
  } catch(e) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<div style="color: #ef4444; font-weight: 500;">❌ Connection error. Please try again.</div>`;
    resultDiv.style.background = '#fef2f2';
    resultDiv.style.borderColor = '#fecaca';
  } finally {
    btn.innerHTML = 'Check Status';
    btn.disabled = false;
  }
};
