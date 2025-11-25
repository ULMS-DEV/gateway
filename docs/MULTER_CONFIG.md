# Multer Configuration

## Overview
Multer is configured globally in the ProctorModule for handling multipart/form-data file uploads.

## Configuration Details

### Location
- **Config File**: `src/config/multer.config.ts`
- **Module**: `src/proctor/proctor.module.ts`

### Settings

#### Storage
- **Type**: Memory Storage (files stored in memory as Buffer objects)
- **Reason**: Ideal for passing files directly to microservices without disk I/O

#### File Size Limits
- **Max File Size**: 10MB per file
- Adjust in `multer.config.ts` if needed

#### File Filtering
- **Accepted Types**: Images only (jpg, jpeg, png, gif, webp)
- **Validation**: MIME type checking
- **Error Handling**: Returns error if non-image files are uploaded

## Usage Example

```typescript
@Post('detect-cheating')
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'reference_image', maxCount: 1 },
  ]),
)
async detectCheating(
  @UploadedFiles()
  files: {
    image?: Express.Multer.File[];
    reference_image?: Express.Multer.File[];
  },
) {
  // Access file buffer
  const imageBuffer = files.image[0].buffer;
  const refImageBuffer = files.reference_image?.[0]?.buffer;
  
  // Process files...
}
```

## Testing with cURL

```bash
# Single image
curl -X POST http://localhost:3000/proctor/detect-cheating \
  -F "image=@path/to/image.jpg"

# With reference image
curl -X POST http://localhost:3000/proctor/detect-cheating \
  -F "image=@path/to/image.jpg" \
  -F "reference_image=@path/to/reference.jpg"
```

## Customization

To modify Multer settings, edit `src/config/multer.config.ts`:

```typescript
export const multerConfig: MulterModuleOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // Change to 20MB
  },
  fileFilter: (req, file, callback) => {
    // Add more MIME types
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|bmp)$/)) {
      return callback(new Error('Only image files are allowed!'), false);
    }
    callback(null, true);
  },
};
```
