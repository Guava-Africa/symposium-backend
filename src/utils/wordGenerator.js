const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, ImageRun } = require('docx');
const sharp = require('sharp');

const fieldLabels = {
  regNumber: 'Registration #',
  title: 'Title',
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  nationality: 'Nationality',
  jobTitle: 'Job Title',
  organization: 'Organization',
  createdAt: 'Registration Date'
};

// Helper to fix image orientation only - no resizing
async function fixOrientation(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    if (metadata.orientation && metadata.orientation > 1) {
      return await sharp(imageBuffer).rotate().toBuffer();
    }
    return imageBuffer;
  } catch (error) {
    console.error('Error fixing orientation:', error);
    return imageBuffer;
  }
}

async function createWordDocumentWithImages({ registrations, fields, title, eventDate, venue }) {
  const rows = [];

  // Header
  const headerCells = fields.map(field => 
    new TableCell({
      children: [
        new Paragraph({
          text: fieldLabels[field] || field,
          alignment: AlignmentType.CENTER,
          bold: true
        })
      ],
      shading: { fill: 'D4AF37' },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 }
      }
    })
  );
  
  headerCells.push(
    new TableCell({
      children: [
        new Paragraph({
          text: 'Photo',
          alignment: AlignmentType.CENTER,
          bold: true
        })
      ],
      shading: { fill: 'D4AF37' },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 }
      }
    })
  );
  
  rows.push(new TableRow({ children: headerCells }));

  // Data rows
  let imageCount = 0;
  
  for (const reg of registrations) {
    const rowCells = fields.map(field => {
      let value = reg[field] !== undefined && reg[field] !== null ? String(reg[field]) : '';
      
      if (field === 'createdAt' && value) {
        try {
          value = new Date(value).toLocaleDateString();
        } catch {
          // keep as is
        }
      }
      
      if (value.length > 100) {
        value = value.substring(0, 97) + '...';
      }
      
      return new TableCell({
        children: [
          new Paragraph({
            text: value,
            alignment: AlignmentType.LEFT
          })
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 }
        }
      });
    });

    // Photo cell - fix orientation only
    let photoParagraph;
    if (reg.imageBuffer && reg.imageExists) {
      try {
        const fixedBuffer = await fixOrientation(reg.imageBuffer);
        const imageRun = new ImageRun({
          data: fixedBuffer,
          transformation: {
            width: 100,
            height: 100
          }
        });
        photoParagraph = new Paragraph({
          children: [imageRun],
          alignment: AlignmentType.CENTER
        });
        imageCount++;
      } catch (imgError) {
        console.error(`Error loading image for ${reg.fullName}:`, imgError.message);
        photoParagraph = new Paragraph({
          text: '⚠️ Error',
          alignment: AlignmentType.CENTER
        });
      }
    } else {
      photoParagraph = new Paragraph({
        text: '📷 No photo',
        alignment: AlignmentType.CENTER
      });
    }

    rowCells.push(
      new TableCell({
        children: [photoParagraph],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 }
        },
        width: {
          size: 15,
          type: 'pct'
        }
      })
    );

    rows.push(new TableRow({ children: rowCells }));
  }

  console.log(`📊 Word document: ${imageCount} images loaded`);

  const table = new Table({ 
    rows: rows,
    width: {
      size: 100,
      type: 'pct'
    }
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,
            bottom: 720,
            left: 720,
            right: 720
          }
        }
      },
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          bold: true,
          size: 28
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `Date: ${eventDate}  |  Venue: ${venue}  |  Total Registrations: ${registrations.length}`,
              size: 24,
              color: '666666'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        table,

        new Paragraph({
          children: [
            new TextRun({
              text: `\nGenerated on: ${new Date().toLocaleString()}`,
              size: 20,
              color: '888888'
            })
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 400 }
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = { createWordDocumentWithImages };