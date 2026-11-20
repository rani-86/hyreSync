const User = require('../models/User');
const { extractResumeText } = require('../services/mlService');
const { rescoreApplicationsForCandidate } = require('../services/scoringService');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resumeUrl: req.file.path, resumeText: null },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Resume uploaded successfully',
      resumeUrl: user.resumeUrl,
      user,
    });

    // Extract once and cache so scoring doesn't re-download/re-parse the PDF,
    // then recompute fit scores for this candidate's existing applications.
    try {
      const extractRes = await extractResumeText({ resumeUrl: user.resumeUrl });
      user.resumeText = extractRes.data.text;
      await user.save();
    } catch (err) {
      console.error('Failed to extract resume text:', err.message);
    }
    rescoreApplicationsForCandidate(user._id).catch((err) =>
      console.error('Failed to rescore applications after resume upload:', err.message)
    );
  } catch (err) {
    res.status(500).json({ message: 'Resume upload failed', error: err.message });
  }
};