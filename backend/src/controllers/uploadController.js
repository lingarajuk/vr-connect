/**
 * @route   POST /api/upload
 * @desc    Upload media file (image, video, audio, document)
 * @access  Private
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file was rejected due to unsupported format.',
      });
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    let fileType = 'file';
    if (req.file.mimetype.startsWith('image/')) fileType = 'image';
    else if (req.file.mimetype.startsWith('video/')) fileType = 'video';
    else if (req.file.mimetype.startsWith('audio/')) fileType = 'audio';

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      fileType,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
};
