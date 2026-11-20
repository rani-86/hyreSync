const User = require('../models/User');
const { extractResumeText } = require('../services/mlService');
const { rescoreApplicationsForCandidate } = require('../services/scoringService');
const { embedResume } = require('../services/embeddingService');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resumeUrl: req.file.path, resumeText: null, resumeEmbedding: [] },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Resume uploaded successfully',
      resumeUrl: user.resumeUrl,
      user,
    });

    // Extract once and cache so scoring doesn't re-download/re-parse the PDF,
    // embed it for the semantic signal, then recompute fit scores for this
    // candidate's existing applications.
    try {
      const extractRes = await extractResumeText({ resumeUrl: user.resumeUrl });
      user.resumeText = extractRes.data.text;
      await user.save();
      await embedResume(user);
    } catch (err) {
      console.error('Failed to extract/embed resume text:', err.message);
    }
    rescoreApplicationsForCandidate(user._id).catch((err) =>
      console.error('Failed to rescore applications after resume upload:', err.message)
    );
  } catch (err) {
    console.error('Resume upload failed:', err.message);
    res.status(500).json({ message: 'Resume upload failed' });
  }
};