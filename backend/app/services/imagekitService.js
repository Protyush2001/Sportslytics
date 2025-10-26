

const imagekit = require('../../config/imagekit');
const fs = require('fs');
const path = require('path');

class ImageKitService {
  static async uploadVideo(filePath, fileName, folder = '/sports-streams') {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      

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
      

      const videoUrl = this.generateVideoUrl(response.filePath);
      
      return {
        url: videoUrl, 
        fileId: response.fileId,
        name: response.name,
        size: response.size,
        filePath: response.filePath,
        mimeType: this.getMimeType(fileExtension),
        originalUrl: response.url 
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw error;
    }
  }

  
  static generateVideoUrl(filePath) {

    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    

    const videoUrl = imagekit.url({
      path: cleanPath,
      transformation: [{
        format: 'mp4',
        quality: '80'
      }],
      signed: false,
      expireSeconds: 3600 
    });
    
    console.log('🎬 Generated video URL:', videoUrl);
    return videoUrl;
  }

  static getMimeType(extension) {
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/mp4', 
      '.mov': 'video/mp4',
      '.avi': 'video/mp4'
    };
    return mimeTypes[extension] || 'video/mp4';
  }

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