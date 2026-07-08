# OpenRepair 🛠️

> [!WARNING]  
> **BETA / IN DEVELOPMENT STAGE**  
> This project is currently in active development (Beta). Features may change, and there might be rough edges. Use in production environments at your own risk!

**OpenRepair** (formerly built for a live production environment) is an open-source, highly responsive, and robust complete ecosystem for running a tech repair shop, computer service center, or any service-oriented business. 

It includes a beautifully designed public-facing website for your customers, combined with a powerful backend API and automated WhatsApp ticketing integration.

---

## 🌟 Live Demo & Happy Customer
This exact codebase is powering **Caliber Link**, a live and highly successful tech servicing business.
Check out the live production version here: **[caliberlink.in](https://caliberlink.in)**

---

## 🚀 Key Features

* **Beautiful "Liquid Glass" UI/UX**: Ultra-modern interface designed for both Desktop and Mobile browsers.
* **Automated Ticket Tracking**: Customers can raise tickets securely, and check status using their Ticket ID and phone number.
* **WhatsApp Bot Integration**: Automatically sends WhatsApp updates to customers when their ticket status changes (Open, In Progress, Resolved, Closed).
* **Private Analytics Engine**: Self-hosted page view and visitor tracking without relying on invasive third-party cookies.
* **Product Catalog**: Beautifully display accessories, refurbished laptops, and other items.
* **Admin Dashboard API**: A fully secure REST API for the admin panel to manage Customers, Invoices, and Tickets.

---

## 📦 Assets & Upgraded Versions
To get the latest upgraded versions of the code and assets, please check the **[Releases](#)** section of this repository. We continuously push production-tested upgrades here.

---

## 🛠️ Tech Stack
* **Frontend**: Vanilla HTML5, CSS3, JavaScript (No heavy frameworks, lightning fast load times).
* **Backend**: Node.js, Express.js.
* **Database**: SQLite (built-in, zero configuration required).
* **Integrations**: `whatsapp-web.js` for automated messaging.

---

## 💻 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/paraspawar-dev/OpenRepair.git
   cd OpenRepair
   ```

2. **Install Server Dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment:**
   Copy the example environment file and edit it with your secrets.
   ```bash
   cp .env.example .env
   ```

4. **Start the Server:**
   ```bash
   npm run start
   ```

5. **Authenticate WhatsApp:**
   Check the server console for the QR code and scan it with your business WhatsApp to link the automated bot.

---

## 💼 Enterprise & Custom Deployments
Looking to deploy this for your own business, or need a fully customized, production-ready website? 

**DM me directly at:** 📩 **[paraspawar.dev@outlook.com](mailto:paraspawar.dev@outlook.com)**

We build high-performance, beautiful, and secure platforms tailored to your business needs.

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  <img src="assets/profile.png" alt="Paras Pawar" width="100">
  <p><b>Developed by Paras Pawar</b></p>
</div>
