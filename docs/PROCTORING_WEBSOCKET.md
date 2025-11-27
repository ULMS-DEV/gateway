# Proctoring WebSocket Gateway

## Overview
The proctoring WebSocket gateway receives images from clients and forwards them to the external proctoring detection API without sending any response back to the client.

## Configuration

### WebSocket Endpoint
- **Namespace**: `/proctoring`
- **Event**: `submit-images`

### External API
- **URL**: `https://v4lv7m3w-8000.euw.devtunnels.ms/api/proctoring/detect-cheating`
- **Method**: POST

## Usage

### Client Connection (JavaScript/TypeScript)

```javascript
import { io } from 'socket.io-client';

// Connect to the WebSocket server
const socket = io('http://localhost:3000/proctoring', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected to proctoring gateway');
  
  // Send images (as base64 or data URLs)
  socket.emit('submit-images', {
    image: 'data:image/jpeg;base64,...', // Required
    reference_image: 'data:image/jpeg;base64,...' // Optional
  });
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <input type="file" id="image" accept="image/*">
  <input type="file" id="reference" accept="image/*">
  <button onclick="submitImages()">Submit Images</button>

  <script>
    const socket = io('http://localhost:3000/proctoring');
    
    socket.on('connect', () => {
      console.log('Connected');
    });

    function toBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
    }

    async function submitImages() {
      const imageFile = document.getElementById('image').files[0];
      const referenceFile = document.getElementById('reference').files[0];
      
      const data = {
        image: await toBase64(imageFile)
      };
      
      if (referenceFile) {
        data.reference_image = await toBase64(referenceFile);
      }
      
      socket.emit('submit-images', data);
      console.log('Images submitted');
    }
  </script>
</body>
</html>
```

### React Example

```tsx
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function ProctoringComponent() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000/proctoring');
    
    newSocket.on('connect', () => {
      console.log('Connected to proctoring');
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, []);

  const handleSubmitImages = async (image: File, referenceImage?: File) => {
    if (!socket) return;
    
    const toBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
    };

    const data: any = {
      image: await toBase64(image)
    };
    
    if (referenceImage) {
      data.reference_image = await toBase64(referenceImage);
    }
    
    socket.emit('submit-images', data);
  };

  return (
    <div>
      {/* Your component UI */}
    </div>
  );
}
```

## Data Format

The WebSocket expects an object with the following structure:

```typescript
{
  image: string;              // Required: Base64 encoded image or data URL
  reference_image?: string;   // Optional: Base64 encoded reference image or data URL
}
```

## Notes

- The gateway does **not** send any response back to the client
- Errors are logged on the server but not transmitted to the client
- The connection uses CORS with origin `*` (consider restricting in production)
- Images are forwarded to the external API as JSON with base64 encoded data
- The WebSocket operates in fire-and-forget mode for minimal latency

## Testing with Socket.IO Client CLI

```bash
npm install -g socket.io-client-tool

# Connect and send test data
socket-io-client-tool -h http://localhost:3000/proctoring -e submit-images -d '{"image":"test_base64_data"}'
```

## Production Considerations

1. **CORS**: Update the CORS origin to match your frontend domain
2. **API URL**: Consider making the external API URL configurable via environment variables
3. **Authentication**: Add authentication/authorization if needed
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Image Size Validation**: Add validation for image size/format before forwarding
