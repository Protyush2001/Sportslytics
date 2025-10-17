// const imagekit = require('../../config/imagekit');
// const fs = require('fs');
// const path = require('path');

// class ImageKitService {
//   static async uploadVideo(filePath, fileName, folder = '/cricket-streams') {
//     try {
//       const fileBuffer = fs.readFileSync(filePath);
      
//       const response = await imagekit.upload({
//         file: fileBuffer,
//         fileName: fileName,
//         folder: folder,
//         useUniqueFileName: true,
//         tags: ['cricket-stream', 'recording']
//       });
      
//       // Clean up local file after upload
//       fs.unlinkSync(filePath);
      
//       return {
//         url: response.url,
//         fileId: response.fileId,
//         name: response.name,
//         size: response.size
//       };
//     } catch (error) {
//       console.error('ImageKit upload error:', error);
//       throw error;
//     }
//   }

//   static async deleteVideo(fileId) {
//     try {
//       await imagekit.deleteFile(fileId);
//       return true;
//     } catch (error) {
//       console.error('ImageKit delete error:', error);
//       throw error;
//     }
//   }

//   static async getVideoUrl(fileId) {
//     try {
//       const response = await imagekit.getFileDetails(fileId);
//       return response.url;
//     } catch (error) {
//       console.error('ImageKit get URL error:', error);
//       throw error;
//     }
//   }
// }

// module.exports = ImageKitService;
// ///////////////////////////////////////////////////////////
// // const imagekit = require('../../config/imagekit');
// // const fs = require('fs');
// // const path = require('path');

// // class ImageKitService {
// //   static async uploadVideo(filePath, fileName, folder = '/cricket-streams') {
// //     try {
// //       console.log('📤 Starting ImageKit upload...');
// //       console.log('File path:', filePath);
// //       console.log('File name:', fileName);

// //       // Check if file exists
// //       if (!fs.existsSync(filePath)) {
// //         throw new Error(`File not found: ${filePath}`);
// //       }

// //       const stats = fs.statSync(filePath);
// //       console.log('File size:', stats.size, 'bytes');

// //       if (stats.size === 0) {
// //         throw new Error('File is empty');
// //       }

// //       const fileBuffer = fs.readFileSync(filePath);
      
// //       // Force MP4 extension for ImageKit video processing
// //       const mp4FileName = fileName.replace(/\.\w+$/, '.mp4');
      
// //       console.log('Uploading to ImageKit as MP4...');
// //       const response = await imagekit.upload({
// //         file: fileBuffer,
// //         fileName: mp4FileName, // Use MP4 extension
// //         folder: folder,
// //         useUniqueFileName: true,
// //         tags: ['cricket-stream', 'recording', 'video'],
// //         isPrivateFile: false,
// //         customMetadata: {
// //           uploadTime: new Date().toISOString(),
// //           fileType: 'video',
// //           source: 'cricket-streaming-app',
// //           originalExtension: path.extname(fileName)
// //         }
// //       });

// //       console.log('✅ ImageKit upload successful');
// //       console.log('Raw response:', response);

// //       if (!response.url || !response.fileId) {
// //         throw new Error('ImageKit did not return valid URL or file ID');
// //       }

// //       // Generate MP4 URL with proper transformation
// //       const mp4Url = this.getMP4VideoUrl(response.filePath);
// //       console.log('🔗 MP4 URL:', mp4Url);

// //       // Clean up local file
// //       try {
// //         fs.unlinkSync(filePath);
// //         console.log('🗑️ Local file cleaned up');
// //       } catch (cleanupError) {
// //         console.warn('Could not delete local file:', cleanupError.message);
// //       }
      
// //       return {
// //         url: mp4Url, // Use the MP4 URL
// //         fileId: response.fileId,
// //         name: response.name,
// //         size: response.size,
// //         filePath: response.filePath,
// //         originalUrl: response.url // Keep original for reference
// //       };
// //     } catch (error) {
// //       console.error('❌ ImageKit upload error:', error);
// //       throw new Error(`ImageKit upload failed: ${error.message}`);
// //     }
// //   }

// //   // Generate MP4 video URL with proper transformation
// //   static getMP4VideoUrl(filePath) {
// //     try {
// //       // Remove leading slash if present
// //       const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      
// //       // Ensure the URL ends with .mp4 for ImageKit processing
// //       const mp4Path = cleanPath.replace(/\.\w+$/, '.mp4');
      
// //       const mp4Url = imagekit.url({
// //         path: mp4Path,
// //         transformation: [{
// //           quality: '80',
// //           format: 'mp4', // Force MP4 format
// //         }],
// //         signed: false,
// //       });

// //       console.log('🔄 Generated MP4 URL:', mp4Url);
// //       return mp4Url;
// //     } catch (error) {
// //       console.error('❌ MP4 URL generation error:', error);
// //       // Fallback to direct URL
// //       const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
// //       const mp4Path = cleanPath.replace(/\.\w+$/, '.mp4');
// //       return `https://ik.imagekit.io/szpbdzzmt/${mp4Path}`;
// //     }
// //   }

// //   // Alternative: Direct MP4 URL without transformations
// //   static getDirectMP4Url(filePath) {
// //     const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
// //     const mp4Path = cleanPath.replace(/\.\w+$/, '.mp4');
// //     return `https://ik.imagekit.io/szpbdzzmt/${mp4Path}`;
// //   }

// //   // Test if file is accessible
// //   static async testFileAccessibility(url) {
// //     try {
// //       const response = await fetch(url, { method: 'HEAD' });
// //       return {
// //         accessible: response.ok,
// //         status: response.status,
// //         statusText: response.statusText
// //       };
// //     } catch (error) {
// //       return {
// //         accessible: false,
// //         error: error.message
// //       };
// //     }
// //   }

// //   // Test connection to ImageKit
// //   static async testConnection() {
// //     try {
// //       const authParams = await imagekit.getAuthenticationParameters();
// //       console.log('✅ ImageKit connection test passed');
// //       return { success: true, authParams };
// //     } catch (error) {
// //       console.error('❌ ImageKit connection test failed:', error);
// //       return { success: false, error: error.message };
// //     }
// //   }
// // }

// // module.exports = ImageKitService;

// const imagekit = require('../../config/imagekit');
// const fs = require('fs');
// const path = require('path');

// class ImageKitService {
//   static async uploadVideo(filePath, fileName, folder = '/cricket-streams') {
//     try {
//       const fileBuffer = fs.readFileSync(filePath);
      
//       // Get file extension from original file
//       const fileExtension = path.extname(filePath).toLowerCase();
//       const finalFileName = fileName.endsWith(fileExtension) 
//         ? fileName 
//         : `${fileName}${fileExtension}`;
      
//       const response = await imagekit.upload({
//         file: fileBuffer,
//         fileName: finalFileName,
//         folder: folder,
//         useUniqueFileName: true,
//         tags: ['cricket-stream', 'recording']
//       });
      
//       // Clean up local file after upload
//       fs.unlinkSync(filePath);
      
//       return {
//         url: response.url,
//         fileId: response.fileId,
//         name: response.name,
//         size: response.size,
//         filePath: response.filePath,
//         mimeType: this.getMimeType(fileExtension)
//       };
//     } catch (error) {
//       console.error('ImageKit upload error:', error);
//       throw error;
//     }
//   }

//   static getMimeType(extension) {
//     const mimeTypes = {
//       '.mp4': 'video/mp4',
//       '.webm': 'video/webm',
//       '.mov': 'video/quicktime',
//       '.avi': 'video/x-msvideo'
//     };
//     return mimeTypes[extension] || 'video/mp4';
//   }

//   static async deleteVideo(fileId) {
//     try {
//       await imagekit.deleteFile(fileId);
//       return true;
//     } catch (error) {
//       console.error('ImageKit delete error:', error);
//       throw error;
//     }
//   }

//   static async getVideoUrl(fileId) {
//     try {
//       const response = await imagekit.getFileDetails(fileId);
//       return response.url;
//     } catch (error) {
//       console.error('ImageKit get URL error:', error);
//       throw error;
//     }
//   }

//   // Test if file is accessible
//   static async testFileAccessibility(url) {
//     try {
//       const response = await fetch(url, { method: 'HEAD' });
//       return {
//         accessible: response.ok,
//         status: response.status,
//         statusText: response.statusText
//       };
//     } catch (error) {
//       return {
//         accessible: false,
//         error: error.message
//       };
//     }
//   }
// }

// module.exports = ImageKitService;

///////////////////////////////////////////////////////

const imagekit = require('../../config/imagekit');
const fs = require('fs');
const path = require('path');

class ImageKitService {
  static async uploadVideo(filePath, fileName, folder = '/sports-streams') {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      
      // Get file extension from original file
      const fileExtension = path.extname(filePath).toLowerCase();
      const finalFileName = fileName.endsWith(fileExtension) 
        ? fileName 
        : `${fileName}${fileExtension}`;
      
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: finalFileName,
        folder: folder,
        useUniqueFileName: true,
        tags: ['cricket-stream', 'recording']
      });
      
      // Clean up local file after upload
      fs.unlinkSync(filePath);
      
      // Generate the proper video URL for streaming
      const videoUrl = this.generateVideoUrl(response.filePath);
      
      return {
        url: videoUrl, // Use the processed video URL instead of direct URL
        fileId: response.fileId,
        name: response.name,
        size: response.size,
        filePath: response.filePath,
        mimeType: this.getMimeType(fileExtension),
        originalUrl: response.url // Keep original for reference
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw error;
    }
  }

  // Generate proper video URL for streaming
  static generateVideoUrl(filePath) {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Generate URL that ends with /ik-video.mp4 for video processing
    const videoUrl = imagekit.url({
      path: cleanPath,
      transformation: [{
        format: 'mp4',
        quality: '80'
      }],
      signed: false,
      expireSeconds: 3600 // 1 hour expiry
    });
    
    console.log('🎬 Generated video URL:', videoUrl);
    return videoUrl;
  }

  static getMimeType(extension) {
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/mp4', // Force mp4 for streaming compatibility
      '.mov': 'video/mp4',
      '.avi': 'video/mp4'
    };
    return mimeTypes[extension] || 'video/mp4';
  }

  // ... rest of your methods (deleteVideo, getVideoUrl, etc.)
    static async deleteVideo(fileId) {
    try {
      await imagekit.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error('ImageKit delete error:', error);
      throw error;
    }
  }

  static async getVideoUrl(fileId) {
    try {
      const response = await imagekit.getFileDetails(fileId);
      return response.url;
    } catch (error) {
      console.error('ImageKit get URL error:', error);
      throw error;
    }
  }

  // Test if file is accessible
  static async testFileAccessibility(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return {
        accessible: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message
      };
    }
  }
}

module.exports = ImageKitService;