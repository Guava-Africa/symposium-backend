const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const { getConfirmationEmail } = require('./email/confirmationEmail');
const createWordDocumentWithImages  = require('./utils/wordGenerator');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const PORT = process.env.PORT || 5000;
const MAX_REGISTRATIONS = 200;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const { fullName } = req.body;
    const safeName = (fullName || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 50);
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${safeName}_${timestamp}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://zimchinasymposium.com'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many registration attempts. Please try again later.' }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running', timestamp: new Date().toISOString() });
});

// ===== COUNT REGISTRATIONS =====
app.get('/api/registrations/count', async (req, res) => {
  try {
    const count = await prisma.registration.count();
    const remaining = Math.max(0, MAX_REGISTRATIONS - count);
    
    res.json({
      success: true,
      data: {
        total: count,
        max: MAX_REGISTRATIONS,
        remaining: remaining,
        isFull: remaining === 0
      }
    });
  } catch (error) {
    console.error('Error counting registrations:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== REGISTRATION ENDPOINT =====
app.post('/api/register', limiter, upload.single('profileImage'), async (req, res) => {
  try {
    console.log('📝 Registration request received');
    
    const { title, fullName, email, phone, nationality, jobTitle, organization } = req.body;
    
    console.log('📦 Data:', { title, fullName, email, phone, nationality, jobTitle, organization });
    console.log('📎 File:', req.file ? req.file.filename : 'No file');
    
    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!fullName) missingFields.push('fullName');
    if (!email) missingFields.push('email');
    if (!phone) missingFields.push('phone');
    if (!nationality) missingFields.push('nationality');
    if (!jobTitle) missingFields.push('jobTitle');
    if (!organization) missingFields.push('organization');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Missing fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Check existing registration
    const existingRegistration = await prisma.registration.findUnique({
      where: { email }
    });

    if (existingRegistration) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Check registration limit
    const currentCount = await prisma.registration.count();
    if (currentCount >= MAX_REGISTRATIONS) {
      return res.status(409).json({ 
        success: false, 
        error: `Registration is full. Maximum ${MAX_REGISTRATIONS} attendees.` 
      });
    }

    // Store file path if uploaded
    let profilePhotoPath = null;
    if (req.file) {
      profilePhotoPath = `/uploads/${req.file.filename}`;
      console.log('✅ Image saved to:', profilePhotoPath);
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        title,
        fullName,
        email,
        phone,
        nationality,
        jobTitle,
        organization,
        profilePhoto: profilePhotoPath,
      }
    });

    const remaining = MAX_REGISTRATIONS - (currentCount + 1);
    console.log('✅ Registration saved, ID:', registration.id, 'Number:', registration.regNumber);
    console.log(`📊 ${remaining} spots remaining`);

    // Send confirmation email
    if (process.env.RESEND_API_KEY) {
      try {
        const emailHtml = getConfirmationEmail({
          id: registration.id,
          regNumber: registration.regNumber,
          title,
          jobTitle,
          fullName,
          organization,
          nationality
        });
        
        await resend.emails.send({
          from: 'Zimbabwe-China Symposium <info@zimchinasymposium.com>',
          to: [email],
          subject: 'Registration Confirmed for Zimbabwe-China Investment Symposium 2026',
          html: emailHtml
        });
        console.log('✅ Email sent to:', email);
      } catch (emailError) {
        console.error('❌ Email error:', emailError.message);
      }
    }

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful! Check your email.',
      data: { 
        regNumber: registration.regNumber,
        email: registration.email,
        remainingSpots: remaining,
        isFull: remaining === 0
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (req.file) {
      const filePath = path.join(uploadsDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Deleted file due to error:', req.file.filename);
      }
    }
    
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + (error.message || 'Unknown error')
    });
  }
});

// ===== GET ALL REGISTRATIONS =====
app.get('/api/registrations', async (req, res) => {
  try {
    const fieldsParam = req.query.fields;
    let selectFields = {};
    
    if (fieldsParam) {
      const fields = fieldsParam.split(',').map(f => f.trim());
      const validFields = ['id', 'regNumber', 'title', 'fullName', 'email', 'phone', 'nationality', 'jobTitle', 'organization', 'profilePhoto', 'createdAt'];
      
      fields.forEach(field => {
        if (validFields.includes(field)) {
          selectFields[field] = true;
        }
      });
    } else {
      selectFields = {
        id: true,
        regNumber: true,
        title: true,
        fullName: true,
        email: true,
        phone: true,
        nationality: true,
        jobTitle: true,
        organization: true,
        createdAt: true
      };
    }

    const registrations = await prisma.registration.findMany({
      orderBy: { regNumber: 'asc' },
      select: selectFields
    });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const registrationsWithUrls = registrations.map(reg => ({
      ...reg,
      photoUrl: reg.profilePhoto ? `${baseUrl}${reg.profilePhoto}` : null
    }));
    
    res.json({ 
      success: true, 
      count: registrationsWithUrls.length,
      data: registrationsWithUrls 
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== EXPORT WORD DOCUMENT =====
app.get('/api/export/word/all/regist', async (req, res) => {
  try {
    const fieldsParam = req.query.fields || 'regNumber,title,fullName,email,phone,organization,nationality,jobTitle';
    const fields = fieldsParam.split(',').map(f => f.trim());
    
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    
    const validFields = ['id', 'regNumber', 'title', 'fullName', 'email', 'phone', 'nationality', 'jobTitle', 'organization', 'profilePhoto', 'createdAt'];
    const selectFields = {};
    fields.forEach(field => {
      if (validFields.includes(field)) {
        selectFields[field] = true;
      }
    });
    
    selectFields.profilePhoto = true;
    
    if (Object.keys(selectFields).length === 0) {
      selectFields = {
        id: true,
        regNumber: true,
        title: true,
        fullName: true,
        email: true,
        phone: true,
        organization: true,
        nationality: true,
        jobTitle: true,
        profilePhoto: true,
        createdAt: true
      };
    }

    const registrations = await prisma.registration.findMany({
      orderBy: { regNumber: 'asc' },
      take: limit || undefined,
      select: selectFields
    });

    if (registrations.length === 0) {
      return res.status(404).json({ success: false, error: 'No registrations found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const registrationsWithImages = await Promise.all(registrations.map(async (reg) => {
      let imageBuffer = null;
      
      if (reg.profilePhoto) {
        try {
          const imagePath = path.join(__dirname, '..', reg.profilePhoto);
          if (fs.existsSync(imagePath)) {
            imageBuffer = fs.readFileSync(imagePath);
            console.log(`📸 Loaded image for ${reg.fullName}: ${reg.profilePhoto}`);
          } else {
            console.log(`⚠️ Image not found for ${reg.fullName}: ${reg.profilePhoto}`);
          }
        } catch (imgError) {
          console.error(`❌ Error loading image for ${reg.fullName}:`, imgError.message);
        }
      }
      
      return {
        ...reg,
        imageBuffer: imageBuffer,
        imageExists: !!imageBuffer
      };
    }));

    const docBuffer = await createWordDocumentWithImages({
      registrations: registrationsWithImages,
      fields: Object.keys(selectFields).filter(f => f !== 'profilePhoto'),
      title: 'Zimbabwe-China Investment Symposium - Registrations',
      eventDate: '2 July 2026',
      venue: 'Golden Conifer Conference Centre, Harare'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=registrations_${new Date().toISOString().split('T')[0]}.docx`);
    res.send(docBuffer);

  } catch (error) {
    console.error('Error exporting Word document:', error);
    res.status(500).json({ success: false, error: 'Error generating document: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🚀 Zimbabwe-China Symposium Backend Running         ║
╠══════════════════════════════════════════════════════════╣
║  📡 Server: http://localhost:${PORT}                       
║  💚 Health: http://localhost:${PORT}/api/health            
║  📧 Email: ${process.env.RESEND_API_KEY ? '✅ Ready' : '❌ Not configured'}
║  🗄️  Database: ✅ MySQL Connected
║  📁 Uploads: ${uploadsDir}
║  📊 Max Registrations: ${MAX_REGISTRATIONS}
╚══════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});