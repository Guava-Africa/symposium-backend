const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, ImageRun } = require('docx');

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

async function createWordDocumentWithImages({ registrations, fields, title, eventDate, venue }) {
  // Build rows with images
  const rows = [];

  // Header row
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

  // Data rows with images
  let imageCount = 0;
  let noImageCount = 0;
  
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
      
      // Truncate long text to avoid breaking table layout
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

    // Add photo cell
    let photoParagraph;
    if (reg.imageBuffer && reg.imageExists) {
      try {
        // Resize image to fit in cell (max 100x100)
        const imageRun = new ImageRun({
          data: reg.imageBuffer,
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
        console.error('Error adding image:', imgError);
        photoParagraph = new Paragraph({
          text: '⚠️ Error loading image',
          alignment: AlignmentType.CENTER
        });
        noImageCount++;
      }
    } else {
      photoParagraph = new Paragraph({
        text: '📷 No photo',
        alignment: AlignmentType.CENTER
      });
      noImageCount++;
    }

    rowCells.push(
      new TableCell({
        children: [photoParagraph],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 }
        }
      })
    );

    rows.push(new TableRow({ children: rowCells }));
  }

  console.log(`📊 Word document: ${imageCount} images, ${noImageCount} no image`);

  // Create the final table
  const table = new Table({ 
    rows: rows,
    width: {
      size: 100,
      type: 'pct'
    }
  });

  // Build document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `Date: ${eventDate}  |  Venue: ${venue}  |  Total Registrations: ${registrations.length}`,
              size: 24
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
              color: '666666'
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