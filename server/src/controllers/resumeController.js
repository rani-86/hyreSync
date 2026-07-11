const User = require('../models/User');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resumeUrl: req.file.path },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Resume uploaded successfully',
      resumeUrl: user.resumeUrl,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: 'Resume upload failed', error: err.message });
  }
};