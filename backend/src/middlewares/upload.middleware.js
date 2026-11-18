import multer from 'multer'
import path from 'node:path'

const storage = multer.memoryStorage()

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()

    if (extension !== '.csv') {
      return callback(
        new Error('Only CSV files are allowed.')
      )
    }

    callback(null, true)
  }
})

export const uploadCsv = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      const isSizeError =
        error instanceof multer.MulterError &&
        error.code === 'LIMIT_FILE_SIZE'

      return res.status(isSizeError ? 413 : 400).json({
        success: false,
        message: isSizeError
          ? 'File size must not exceed 5MB.'
          : error.message
      })
    }

    next()
  })
}