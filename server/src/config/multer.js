const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: 'hiresync/resumes',
    resource_type: 'raw',
    allowed_formats: ['pdf'],
    public_id: `${req.user.id}-${Date.now()}.pdf`,
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;