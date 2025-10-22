

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