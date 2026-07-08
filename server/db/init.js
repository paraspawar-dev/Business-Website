const DB = require('./database');
const bcrypt = require('bcrypt');

function runSeeder() {
  console.log('Running database seeder...');
  
  DB.transaction(() => {
    // 1. Seed Admin User
    const adminCount = DB.get('SELECT COUNT(*) as count FROM admin_users').count;
    if (adminCount === 0) {
      console.log('Seeding default admin user...');
      const hash = bcrypt.hashSync('Paras@1123', 12);
      DB.run(`
        INSERT INTO admin_users (username, password_hash, display_name, role) 
        VALUES (?, ?, ?, ?)
      `, ['admin', hash, 'Paras Pawar', 'admin']);
    }

    // 2. Seed Reply Templates
    const templateCount = DB.get('SELECT COUNT(*) as count FROM reply_templates').count;
    if (templateCount === 0) {
      console.log('Seeding default reply templates...');
      const templates = [
        {
          name: 'Repair Acknowledgment',
          subject: 'We have received your repair request - OpenRepair',
          body: 'Dear {customer_name},\n\nThank you for reaching out to OpenRepair. We have received your repair request for your {device}.\n\nYour ticket number is {ticket_id}. Our technician will contact you shortly to schedule the service.\n\nBest regards,\nOpenRepair Team',
          category: 'Repair',
          is_default: 1
        },
        {
          name: 'Repair Complete',
          subject: 'Your repair is complete! - OpenRepair',
          body: 'Dear {customer_name},\n\nGood news! The repair for your {device} (Ticket: {ticket_id}) has been completed.\n\nPlease let us know when you would like to pick it up or if you need it delivered.\n\nBest regards,\nOpenRepair Team',
          category: 'Repair',
          is_default: 0
        },
        {
          name: 'Sales Follow-up',
          subject: 'Information regarding your product inquiry',
          body: 'Dear {customer_name},\n\nThank you for your interest in our products. Regarding your inquiry on ticket {ticket_id}:\n\n[Insert product details and pricing here]\n\nPlease let us know if you have any questions.\n\nBest regards,\nOpenRepair Sales Team',
          category: 'Sales',
          is_default: 1
        },
        {
          name: 'AMC Inquiry Response',
          subject: 'Information about OpenRepair AMC Plans',
          body: 'Dear {customer_name},\n\nThank you for considering OpenRepair for your IT maintenance needs. Our AMC plans are designed to keep your business running smoothly.\n\nI have attached our AMC brochure for your review. When would be a good time to call you to discuss your specific requirements?\n\nBest regards,\nOpenRepair Enterprise Team',
          category: 'AMC',
          is_default: 1
        }
      ];
      
      const insertTemplate = db.instance.prepare(`
        INSERT INTO reply_templates (name, subject, body, category, is_default) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      for (const t of templates) {
        insertTemplate.run(t.name, t.subject, t.body, t.category, t.is_default);
      }
    }

    // 3. Seed Products (Migrated from hardcoded JS)
    const productCount = DB.get('SELECT COUNT(*) as count FROM products').count;
    if (productCount === 0) {
      console.log('Seeding products...');
      const products = [
        { name: 'ThinkPad T480', category: 'laptops', condition: 'refurbished', price: 24500, specs: 'Core i5 8th Gen | 16GB RAM | 512GB SSD', image: 'assets/products/p1.jpg' },
        { name: 'MacBook Air M1', category: 'laptops', condition: 'pre-owned', price: 55000, specs: 'M1 Chip | 8GB RAM | 256GB SSD', image: 'assets/products/p2.jpg' },
        { name: 'Dell OptiPlex 7050', category: 'desktops', condition: 'refurbished', price: 15000, specs: 'Core i5 7th Gen | 8GB RAM | 256GB SSD', image: 'assets/products/p3.jpg' },
        { name: 'Custom Gaming PC', category: 'desktops', condition: 'new', price: 65000, specs: 'Ryzen 5 | 16GB RAM | RTX 3060', image: 'assets/products/p4.jpg' },
        { name: 'Logitech MX Master 3', category: 'accessories', condition: 'new', price: 7999, specs: 'Wireless | Ergonomic | Multi-device', image: 'assets/products/p5.jpg' },
        { name: 'HP LaserJet Pro', category: 'accessories', condition: 'new', price: 12500, specs: 'Wireless Print/Scan/Copy', image: 'assets/products/p6.jpg' }
      ];
      
      const insertProduct = db.instance.prepare(`
        INSERT INTO products (name, category, condition, price, specs, image_path, sort_order) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      products.forEach((p, i) => {
        insertProduct.run(p.name, p.category, p.condition, p.price, p.specs, p.image, i);
      });
    }

    // 4. Seed AMC Plans
    const planCount = DB.get('SELECT COUNT(*) as count FROM amc_plans').count;
    if (planCount === 0) {
      console.log('Seeding AMC plans...');
      const plans = [
        { name: 'Silver Plan', icon: '💻', target: 'Small Offices (1-5 PCs)', features: JSON.stringify(['Monthly Preventive Maintenance', 'Remote Support (NBD)', 'Hardware Troubleshooting', 'Basic Antivirus Support']), is_featured: 0 },
        { name: 'Gold Plan', icon: '🏢', target: 'Medium Offices (5-20 PCs)', features: JSON.stringify(['Bi-Weekly Maintenance', 'Priority Remote Support (4hrs)', 'Network & Wi-Fi Management', 'Data Backup Assistance', 'Hardware Replacement Support']), is_featured: 1 },
        { name: 'Platinum Plan', icon: '🏛️', target: 'Enterprise (20+ PCs)', features: JSON.stringify(['Weekly Maintenance Visits', '24/7 Remote Support', 'Complete IT Infrastructure Management', 'Server & Firewall Management', 'Dedicated Account Manager']), is_featured: 0 }
      ];
      
      const insertPlan = db.instance.prepare(`
        INSERT INTO amc_plans (name, icon, target_audience, features, is_featured, sort_order) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      plans.forEach((p, i) => {
        insertPlan.run(p.name, p.icon, p.target, p.features, p.is_featured, i);
      });
    }

    // 5. Seed Testimonials
    const testimonialCount = DB.get('SELECT COUNT(*) as count FROM testimonials').count;
    if (testimonialCount === 0) {
      console.log('Seeding testimonials...');
      const testimonials = [
        { name: "Rajesh K.", role: "Small Business Owner", stars: 5, text: "Excellent AMC service. They manage all 15 PCs in our office seamlessly." },
        { name: "Priya S.", role: "Graphic Designer", stars: 5, text: "Fixed my MacBook screen within 24 hours. Very professional and fair pricing." },
        { name: "Amit M.", role: "Student", stars: 4, text: "Bought a refurbished ThinkPad. Works like new! Highly recommended." },
        { name: "Neha P.", role: "Home User", stars: 5, text: "Data recovery was successful. They saved 10 years of family photos." },
        { name: "Vikram D.", role: "Corporate Client", stars: 5, text: "The CCTV installation and network setup for our new branch was flawless." },
        { name: "Sneha J.", role: "Freelancer", stars: 5, text: "Prompt home visit for my laptop repair. Very polite and knowledgeable technician." }
      ];
      
      const insertTestimonial = db.instance.prepare(`
        INSERT INTO testimonials (name, role, stars, text, sort_order) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      testimonials.forEach((t, i) => {
        insertTestimonial.run(t.name, t.role, t.stars, t.text, i);
      });
      
      console.log('Seeding CMS Content...');
      const cmsData = [
        { section: 'home', key: 'hero_badge', val: '⚡ 10+ Years of Trust' },
        { section: 'home', key: 'hero_title', val: 'Expert Computer Repair & IT Services' },
        { section: 'home', key: 'hero_subtitle', val: 'Complete IT Solutions, Sales & Services for Home and Business in Thane.' }
      ];
      const insertCMS = db.instance.prepare(`INSERT INTO cms_content (section, content_key, content_value) VALUES (?, ?, ?)`);
      cmsData.forEach(c => insertCMS.run(c.section, c.key, c.val));
    }
  }); // end transaction
  
  console.log('Database seeding complete.');
}

// Access db.instance inside the seeder
const db = require('./database');

module.exports = runSeeder;
