import { MulterModuleOptions } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export const multerConfig: MulterModuleOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, callback) => {
    // Accept images only
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new Error('Only image files are allowed!'), false);
    }
    callback(null, true);
  },
};
