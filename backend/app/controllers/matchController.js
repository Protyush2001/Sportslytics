

/////////////////////////////////////////////////////////////////////////////////////

const Joi = require("joi");
const bcryptjs = require("bcryptjs");
const ImageKitService = require('../services/imagekitService');
const CommentaryService = require('../services/commentaryService');
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const customMatch = require("../models/customMatch-model");
const cors = require("cors");
const { v4: uuidv4 } = require('uuid'); // You'll need to install this: npm install uuid

const customMatchValidationSchema = require("../validations/customMatch-validation");

const customMatchController = {};

customMatchController.createMatches = async (req, res) => {
  try {
    const allowedRoles = ["admin", "team_owner", "player"];
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ msg: "Access denied: insufficient permissions" });
    }

    const { error } = customMatchValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ msg: error.details[0].message });
    }

    const match = new customMatch({
      ...req.body,
      createdBy: req.user._id,
      inningsScores: [],
    }); 
    await match.save();
    res.status(201).json(match);
  } catch (err) {
    console.error("Error creating match:", err.message);
    res.status(500).json({ msg: "Internal Server Error", error: err.message });
  }
};



const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Team = require("../models/team-model");


// if (!require('fs').existsSync(uploadsDir)) {
//   require('fs').mkdirSync(uploadsDir, { recursive: true });
// }
// // Configure multer for video file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir) // Make sure this directory exists
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = `recording_${req.params.matchId}_${Date.now()}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   }
// });
// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'Recordings');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads/Recordings directory at:', uploadsDir);
}
// // Configure multer for video file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir) // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueName = `recording_${req.params.matchId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});


//   try {
//     const match = await customMatch.findById(req.params.matchId);
//     if (!match) return res.status(404).json({ msg: "Match not found" });

//     // Basic auth check
//     if (match.createdBy.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ msg: "Not authorized to start stream" });
//     }

//     // Initialize stream object if it doesn't exist
//     if (!match.stream) {
//       match.stream = {};
//     }

//     // Check if already streaming
//     if (match.stream.isLive) {
//       return res.status(400).json({ msg: "Stream is already active" });
//     }

//     // Generate unique identifiers
//     const roomId = `match_${match._id}_${Date.now()}`;
//     const recordingId = uuidv4();

//     // Initialize pastStreams array if it doesn't exist
//     if (!match.pastStreams) {
//       match.pastStreams = [];
//     }

//     // Set stream status
//     match.stream = {
//       isLive: true,
//       roomId: roomId,
//       startedBy: req.user._id,
//       startedAt: new Date(),
//       recordingStatus: 'recording',
//       activeRecordingId: recordingId
//     };

//     // Create initial pastStream entry
//     match.pastStreams.push({
//       roomId: roomId,
//       startedBy: req.user._id,
//       startedAt: new Date(),
//       endedAt: null, // Will be set when stream stops
//       recordingId: recordingId,
//       recordingUrl: null, // Will be set when recording is uploaded
//       processed: false,
//       uploadStatus: 'pending',
//       uploadProgress: 0,
//       fileSize: null,
//       mimeType: null,
//       duration: null,
//       errorMessage: null
//     });

//     // Mark as modified to ensure save works
//     match.markModified('stream');
//     match.markModified('pastStreams');

//     await match.save();

//     console.log(`Stream started for match ${match._id} with recording ID: ${recordingId}`);
//     console.log(`PastStreams count: ${match.pastStreams.length}`);

//     res.status(200).json({ 
//       msg: "Stream and recording started", 
//       match,
//       recordingId,
//       roomId,
//       pastStreamsCount: match.pastStreams.length
//     });
//   } catch (err) {
//     console.error("Error starting stream:", err);
//     res.status(500).json({ msg: "Internal Server Error", error: err.message });
//   }
// };

// FIXED stopStream method
// UPDATED START STREAMING FUNCTION - MP4 FOCUSED

customMatchController.startStream = async (req, res) => {
  try {
    const match = await customMatch.findById(req.params.matchId);
    if (!match) return res.status(404).json({ msg: "Match not found" });

    // Basic auth check
    if (match.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Not authorized to start stream" });
    }

    // Initialize stream object if it doesn't exist
    if (!match.stream) {
      match.stream = {};
    }

    if (match.stream.isLive) {
      return res.status(400).json({ msg: "Stream is already active" });
    }


    const roomId = `match_${match._id}_${Date.now()}`;
    const recordingId = uuidv4();

  
    if (!match.pastStreams) {
      match.pastStreams = [];
    }

    match.stream = {
      isLive: true,
      roomId: roomId,
      startedBy: req.user._id,
      startedAt: new Date(),
      recordingStatus: 'recording',
      activeRecordingId: recordingId,
      preferredFormats: ['mp4', 'webm'], 
      maxDuration: 60 * 60 * 1000 
    };

    
    match.pastStreams.push({
      roomId: roomId,
      startedBy: req.user._id,
      startedAt: new Date(),
      endedAt: null, 
      recordingId: recordingId,
      recordingUrl: null, 
      processed: false,
      uploadStatus: 'pending',
      uploadProgress: 0,
      fileSize: null,
      mimeType: null,
      duration: null,
      errorMessage: null,
      targetFormat: 'mp4', // Specify target format for ImageKit processing
      videoQuality: 'high', // Quality setting
      requiresProcessing: true, // Flag that this needs ImageKit video processing
      streamingReady: false // Will be true after ImageKit processing
    });

    // Mark as modified to ensure save works
    match.markModified('stream');
    match.markModified('pastStreams');

    await match.save();

    console.log(`🎬 Stream started for match ${match._id}`);
    console.log(`📹 Recording ID: ${recordingId}`);
    console.log(`🆔 Room ID: ${roomId}`);
    console.log(`📊 PastStreams count: ${match.pastStreams.length}`);
    console.log(`🎯 Target format: MP4 for ImageKit compatibility`);

    // Emit socket event for stream start
    try {
      const io = require('../../index.js').io;
      if (io) {
        io.to(`match_${match._id}`).emit('stream_started', {
          matchId: match._id,
          recordingId: recordingId,
          roomId: roomId,
          startedAt: new Date(),
          message: 'Live stream started'
        });
      }
    } catch (socketError) {
      console.error('Socket error (non-critical):', socketError);
    }

    res.status(200).json({ 
      msg: "Stream and recording started", 
      match: {
        _id: match._id,
        title: match.title,
        stream: match.stream
      },
      recordingId,
      roomId,
      pastStreamsCount: match.pastStreams.length,
      videoInfo: {
        preferredFormats: ['mp4', 'webm'],
        targetProcessing: 'mp4',
        requiresImageKitProcessing: true
      }
    });
  } catch (err) {
    console.error("❌ Error starting stream:", err);
    
    // Clean up on error
    try {
      const match = await customMatch.findById(req.params.matchId);
      if (match && match.stream) {
        match.stream.isLive = false;
        match.stream.recordingStatus = 'failed';
        await match.save();
      }
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }
    
    res.status(500).json({ 
      msg: "Internal Server Error", 
      error: err.message,
      details: "Failed to initialize stream recording"
    });
  }
};

customMatchController.stopStream = async (req, res) => {
  try {
    const match = await customMatch.findById(req.params.matchId);
    if (!match) return res.status(404).json({ msg: "Match not found" });

    if (match.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    const { recordingUrl } = req.body;

    // Initialize pastStreams array if it doesn't exist
    if (!match.pastStreams) {
      match.pastStreams = [];
    }

    let streamUpdated = false;

    if (match.stream && match.stream.isLive) {
      // Find existing stream entry by recordingId or roomId
      let existingStreamIndex = -1;
      
      if (match.stream.activeRecordingId) {
        existingStreamIndex = match.pastStreams.findIndex(
          stream => stream.recordingId === match.stream.activeRecordingId
        );
      }
      
      if (existingStreamIndex === -1 && match.stream.roomId) {
        existingStreamIndex = match.pastStreams.findIndex(
          stream => stream.roomId === match.stream.roomId
        );
      }

      if (existingStreamIndex !== -1) {
        // Update existing pastStream entry
        match.pastStreams[existingStreamIndex] = {
          ...match.pastStreams[existingStreamIndex],
          endedAt: new Date(),
          recordingUrl: recordingUrl || null,
          processed: !!recordingUrl,
          uploadStatus: recordingUrl ? 'completed' : 'pending',
          uploadProgress: recordingUrl ? 100 : 0
        };
        streamUpdated = true;
      } else {
        // Create new pastStream entry if none exists
        match.pastStreams.push({
          roomId: match.stream.roomId,
          startedBy: match.stream.startedBy,
          startedAt: match.stream.startedAt,
          endedAt: new Date(),
          recordingId: match.stream.activeRecordingId || uuidv4(),
          recordingUrl: recordingUrl || null,
          processed: !!recordingUrl,
          uploadStatus: recordingUrl ? 'completed' : 'pending',
          uploadProgress: recordingUrl ? 100 : 0,
          fileSize: null,
          mimeType: null,
          duration: null,
          errorMessage: null
        });
        streamUpdated = true;
      }
    }

    // Clear current stream status
    match.stream = {
      isLive: false,
      roomId: null,
      startedBy: null,
      startedAt: null,
      recordingStatus: recordingUrl ? 'completed' : 'pending',
      activeRecordingId: null
    };

    // Mark as modified to ensure save works
    match.markModified('stream');
    match.markModified('pastStreams');

    await match.save();

    console.log(`Stream stopped for match ${match._id}${recordingUrl ? ` with recording: ${recordingUrl}` : ''}`);
    console.log(`PastStreams count: ${match.pastStreams.length}`);

    res.status(200).json({
      msg: "Stream stopped",
      match,
      pastStreamsCount: match.pastStreams.length
    });
  } catch (err) {
    console.error("Error stopping stream:", err);
    res.status(500).json({ msg: "Internal Server Error", error: err.message });
  }
};


//   try {
//     const { matchId } = req.params;
//     const { recordingId } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ msg: "No video file uploaded" });
//     }

//     const match = await customMatch.findById(matchId);
//     if (!match) {
//       return res.status(404).json({ msg: "Match not found" });
//     }

//     // Basic auth check
//     if (match.createdBy.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ msg: "Not authorized to upload recording" });
//     }

//     try {
//       // Get file extension from uploaded file
//       const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
//       // Generate filename with correct extension
//       const uniqueFileName = `recording_${matchId}_${Date.now()}${fileExtension}`;
      
//       console.log('📤 Uploading to ImageKit:', {
//         originalName: req.file.originalname,
//         extension: fileExtension,
//         targetName: uniqueFileName,
//         size: req.file.size
//       });

//       const uploadResult = await ImageKitService.uploadVideo(
//         req.file.path,
//         uniqueFileName,
//         '/cricket-streams'
//       );

//       console.log('✅ ImageKit upload completed:', {
//         url: uploadResult.url,
//         fileId: uploadResult.fileId,
//         mimeType: uploadResult.mimeType
//       });

//       const recordingUrl = uploadResult.url;

//       // Initialize pastStreams array if it doesn't exist
//       if (!match.pastStreams) {
//         match.pastStreams = [];
//       }

//       let updatedExisting = false;
      
//       // First try to find by recordingId if provided
//       if (recordingId) {
//         const streamIndex = match.pastStreams.findIndex(
//           stream => stream.recordingId === recordingId
//         );
        
//         if (streamIndex !== -1) {
//           match.pastStreams[streamIndex] = {
//             ...match.pastStreams[streamIndex],
//             recordingUrl,
//             fileSize: uploadResult.size,
//             mimeType: uploadResult.mimeType,
//             processed: true,
//             uploadStatus: 'completed',
//             uploadProgress: 100,
//             endedAt: match.pastStreams[streamIndex].endedAt || new Date(),
//             imagekitFileId: uploadResult.fileId,
//             imagekitFileName: uploadResult.name,
//             imagekitFilePath: uploadResult.filePath,
//             videoFormat: fileExtension.replace('.', ''),
//             lastUpdated: new Date()
//           };
//           updatedExisting = true;
//           console.log(`📝 Updated existing stream with recordingId: ${recordingId}`);
//         }
//       }
      
//       // If not found by recordingId, look for an existing pastStream without recordingUrl
//       if (!updatedExisting) {
//         for (let i = match.pastStreams.length - 1; i >= 0; i--) {
//           if (!match.pastStreams[i].recordingUrl || match.pastStreams[i].uploadStatus !== 'completed') {
//             match.pastStreams[i] = {
//               ...match.pastStreams[i],
//               recordingUrl,
//               fileSize: uploadResult.size,
//               mimeType: uploadResult.mimeType,
//               processed: true,
//               uploadStatus: 'completed',
//               uploadProgress: 100,
//               endedAt: match.pastStreams[i].endedAt || new Date(),
//               imagekitFileId: uploadResult.fileId,
//               imagekitFileName: uploadResult.name,
//               imagekitFilePath: uploadResult.filePath,
//               videoFormat: fileExtension.replace('.', ''),
//               lastUpdated: new Date()
//             };
//             updatedExisting = true;
//             console.log(`📝 Updated stream at index ${i}`);
//             break;
//           }
//         }
//       }

//       // If no existing pastStream found, create new one
//       if (!updatedExisting) {
//         match.pastStreams.push({
//           roomId: match.stream?.roomId || `match_${matchId}_${Date.now()}`,
//           startedBy: req.user._id,
//           startedAt: new Date(Date.now() - 60000),
//           endedAt: new Date(),
//           recordingUrl,
//           fileSize: uploadResult.size,
//           mimeType: uploadResult.mimeType,
//           processed: true,
//           uploadStatus: 'completed',
//           uploadProgress: 100,
//           recordingId: recordingId || uuidv4(),
//           imagekitFileId: uploadResult.fileId,
//           imagekitFileName: uploadResult.name,
//           imagekitFilePath: uploadResult.filePath,
//           videoFormat: fileExtension.replace('.', ''),
//           lastUpdated: new Date()
//         });
//         console.log('📝 Created new stream entry');
//       }

//       // Clear current stream status if still active
//       if (match.stream && match.stream.isLive) {
//         match.stream = {
//           isLive: false,
//           roomId: null,
//           startedBy: null,
//           startedAt: null,
//           recordingStatus: 'completed',
//           activeRecordingId: null
//         };
//       }

//       // Mark as modified to ensure save works
//       match.markModified('stream');
//       match.markModified('pastStreams');

//       await match.save();

//       console.log(`✅ Database updated successfully for match ${matchId}`);
//       console.log(`🌐 Final URL: ${recordingUrl}`);
//       console.log(`📊 PastStreams count: ${match.pastStreams.length}`);

//       // Emit socket event for recording upload completion
//       try {
//         const io = require('../../server').io;
//         if (io) {
//           io.to(`match_${matchId}`).emit('recording_uploaded', {
//             matchId: matchId,
//             recordingId: recordingId,
//             recordingUrl: recordingUrl,
//             fileSize: uploadResult.size,
//             mimeType: uploadResult.mimeType,
//             message: 'Recording uploaded to cloud'
//           });
//         }
//       } catch (socketError) {
//         console.error('Socket error (non-critical):', socketError);
//       }

//       res.status(200).json({
//         msg: "Recording uploaded to ImageKit successfully",
//         recordingUrl,
//         fileSize: uploadResult.size,
//         imagekitFileId: uploadResult.fileId,
//         mimeType: uploadResult.mimeType,
//         videoFormat: fileExtension.replace('.', ''),
//         match: {
//           _id: match._id,
//           pastStreams: match.pastStreams.slice(-3) // Return only recent streams
//         }
//       });

//     } catch (uploadError) {
//       console.error('❌ ImageKit upload failed:', uploadError);
      
//       // Update status as failed
//       if (recordingId) {
//         try {
//           const streamIndex = match.pastStreams.findIndex(
//             stream => stream.recordingId === recordingId
//           );
//           if (streamIndex !== -1) {
//             match.pastStreams[streamIndex].uploadStatus = 'failed';
//             match.pastStreams[streamIndex].errorMessage = uploadError.message;
//             match.pastStreams[streamIndex].lastUpdated = new Date();
//             match.markModified('pastStreams');
//             await match.save();
//           }
//         } catch (saveError) {
//           console.error('Failed to update status:', saveError);
//         }
//       }
      
//       // Clean up local file if upload failed
//       try {
//         if (req.file && fs.existsSync(req.file.path)) {
//           fs.unlinkSync(req.file.path);
//         }
//       } catch (cleanupError) {
//         console.error('Failed to clean up local file:', cleanupError);
//       }
      
//       res.status(500).json({ 
//         msg: "Failed to upload recording to cloud", 
//         error: uploadError.message 
//       });
//     }

//   } catch (err) {
//     console.error("💥 Controller error:", err);
    
//     // Clean up local file on error
//     try {
//       if (req.file && fs.existsSync(req.file.path)) {
//         fs.unlinkSync(req.file.path);
//       }
//     } catch (cleanupError) {
//       console.error('Failed to clean up local file:', cleanupError);
//     }
    
//     res.status(500).json({ 
//       msg: "Internal Server Error", 
//       error: err.message 
//     });
//   }
// };

customMatchController.uploadRecording = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { recordingId } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: "No video file uploaded" });
    }

    const match = await customMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }

    // Basic auth check
    if (match.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Not authorized to upload recording" });
    }

    try {
      // Get file extension from uploaded file
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      // Generate filename with correct extension
      const uniqueFileName = `recording_${matchId}_${Date.now()}${fileExtension}`;
      
      console.log('📤 Uploading to ImageKit:', {
        originalName: req.file.originalname,
        extension: fileExtension,
        targetName: uniqueFileName,
        size: req.file.size
      });

      const uploadResult = await ImageKitService.uploadVideo(
        req.file.path,
        uniqueFileName,
        '/cricket-streams'
      );

      console.log(' ImageKit upload completed:', {
        url: uploadResult.url,
        fileId: uploadResult.fileId,
        mimeType: uploadResult.mimeType,
        filePath: uploadResult.filePath
      });

    
      const generateImageKitVideoUrl = (filePath) => {
       
        // const imageKitEndpoint = 'https://ik.imagekit.io/szpbdzzmt';
        const imageKitEndpoint = 'https://ik.imagekit.io/lqildpfrq';
        
      
        const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        
      
        return `${imageKitEndpoint}/${cleanPath}/ik-video.mp4`;
      };

      
      const videoUrl = generateImageKitVideoUrl(uploadResult.filePath);
      
      console.log('🎬 Generated video streaming URL:', videoUrl);

      // Now use videoUrl instead of uploadResult.url
      const recordingUrl = videoUrl;

      // Initialize pastStreams array if it doesn't exist
      if (!match.pastStreams) {
        match.pastStreams = [];
      }

      let updatedExisting = false;
      
      // First try to find by recordingId if provided
      if (recordingId) {
        const streamIndex = match.pastStreams.findIndex(
          stream => stream.recordingId === recordingId
        );
        
        if (streamIndex !== -1) {
          match.pastStreams[streamIndex] = {
            ...match.pastStreams[streamIndex],
            recordingUrl, // This now uses the proper video URL
            fileSize: uploadResult.size,
            mimeType: 'video/mp4', // Force MP4 for streaming
            processed: true,
            uploadStatus: 'completed',
            uploadProgress: 100,
            endedAt: match.pastStreams[streamIndex].endedAt || new Date(),
            imagekitFileId: uploadResult.fileId,
            imagekitFileName: uploadResult.name,
            imagekitFilePath: uploadResult.filePath,
            videoFormat: 'mp4', // Always MP4 for streaming
            lastUpdated: new Date()
          };
          updatedExisting = true;
          console.log(`📝 Updated existing stream with recordingId: ${recordingId}`);
        }
      }
      
      // If not found by recordingId, look for an existing pastStream without recordingUrl
      if (!updatedExisting) {
        for (let i = match.pastStreams.length - 1; i >= 0; i--) {
          if (!match.pastStreams[i].recordingUrl || match.pastStreams[i].uploadStatus !== 'completed') {
            match.pastStreams[i] = {
              ...match.pastStreams[i],
              recordingUrl,
              fileSize: uploadResult.size,
              mimeType: 'video/mp4',
              processed: true,
              uploadStatus: 'completed',
              uploadProgress: 100,
              endedAt: match.pastStreams[i].endedAt || new Date(),
              imagekitFileId: uploadResult.fileId,
              imagekitFileName: uploadResult.name,
              imagekitFilePath: uploadResult.filePath,
              videoFormat: 'mp4',
              lastUpdated: new Date()
            };
            updatedExisting = true;
            console.log(`📝 Updated stream at index ${i}`);
            break;
          }
        }
      }

      
      if (!updatedExisting) {
        match.pastStreams.push({
          roomId: match.stream?.roomId || `match_${matchId}_${Date.now()}`,
          startedBy: req.user._id,
          startedAt: new Date(Date.now() - 60000),
          endedAt: new Date(),
          recordingUrl,
          fileSize: uploadResult.size,
          mimeType: 'video/mp4',
          processed: true,
          uploadStatus: 'completed',
          uploadProgress: 100,
          recordingId: recordingId || uuidv4(),
          imagekitFileId: uploadResult.fileId,
          imagekitFileName: uploadResult.name,
          imagekitFilePath: uploadResult.filePath,
          videoFormat: 'mp4',
          lastUpdated: new Date()
        });
        console.log('📝 Created new stream entry');
      }

      // Clear current stream status if still active
      if (match.stream && match.stream.isLive) {
        match.stream = {
          isLive: false,
          roomId: null,
          startedBy: null,
          startedAt: null,
          recordingStatus: 'completed',
          activeRecordingId: null
        };
      }

      // Mark as modified to ensure save works
      match.markModified('stream');
      match.markModified('pastStreams');

      await match.save();

      console.log(`✅ Database updated successfully for match ${matchId}`);
      console.log(`🌐 Final streaming URL: ${recordingUrl}`);
      console.log(`📊 PastStreams count: ${match.pastStreams.length}`);

      // Emit socket event for recording upload completion
      try {
        const io = require('../../index.js').io;
        if (io) {
          io.to(`match_${matchId}`).emit('recording_uploaded', {
            matchId: matchId,
            recordingId: recordingId,
            recordingUrl: recordingUrl,
            fileSize: uploadResult.size,
            mimeType: 'video/mp4',
            message: 'Recording uploaded to cloud and processed for streaming'
          });
        }
      } catch (socketError) {
        console.error('Socket error (non-critical):', socketError);
      }

      res.status(200).json({
        msg: "Recording uploaded to ImageKit successfully and processed for streaming",
        recordingUrl,
        fileSize: uploadResult.size,
        imagekitFileId: uploadResult.fileId,
        mimeType: 'video/mp4',
        videoFormat: 'mp4',
        match: {
          _id: match._id,
          pastStreams: match.pastStreams.slice(-3) 
        }
      });

    } catch (uploadError) {
      console.error(' ImageKit upload failed:', uploadError);
      
      // Update status as failed
      if (recordingId) {
        try {
          const streamIndex = match.pastStreams.findIndex(
            stream => stream.recordingId === recordingId
          );
          if (streamIndex !== -1) {
            match.pastStreams[streamIndex].uploadStatus = 'failed';
            match.pastStreams[streamIndex].errorMessage = uploadError.message;
            match.pastStreams[streamIndex].lastUpdated = new Date();
            match.markModified('pastStreams');
            await match.save();
          }
        } catch (saveError) {
          console.error('Failed to update status:', saveError);
        }
      }
      
      // Clean up local file if upload failed
      try {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error('Failed to clean up local file:', cleanupError);
      }
      
      res.status(500).json({ 
        msg: "Failed to upload recording to cloud", 
        error: uploadError.message 
      });
    }

  } catch (err) {
    console.error("💥 Controller error:", err);
    
    // Clean up local file on error
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up local file:', cleanupError);
    }
    
    res.status(500).json({ 
      msg: "Internal Server Error", 
      error: err.message 
    });
  }
};

//   try {
//     const { matchId } = req.params;
//     const { recordingId } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ msg: "No video file uploaded" });
//     }

//     console.log('📥 Upload request received for match:', matchId);

//     const match = await customMatch.findById(matchId);
//     if (!match) {
//       return res.status(404).json({ msg: "Match not found" });
//     }

//     if (match.createdBy.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ msg: "Not authorized to upload recording" });
//     }

//     try {
//       // Generate unique filename with MP4 extension
//       const uniqueFileName = `recording_${matchId}_${Date.now()}.mp4`;
      
//       const uploadResult = await ImageKitService.uploadVideo(
//         req.file.path,
//         uniqueFileName,
//         '/cricket-streams'
//       );

//       console.log('✅ ImageKit upload completed');
//       console.log('MP4 URL:', uploadResult.url);

//       // Test if the URL is accessible
//       const accessibilityTest = await ImageKitService.testFileAccessibility(uploadResult.url);
//       console.log('🔍 URL accessibility test:', accessibilityTest);

//       const recordingUrl = uploadResult.url;

//       // Initialize pastStreams
//       if (!match.pastStreams) {
//         match.pastStreams = [];
//       }

//       let targetStreamIndex = -1;
      
//       // Find the stream to update
//       if (recordingId) {
//         targetStreamIndex = match.pastStreams.findIndex(
//           stream => stream.recordingId === recordingId
//         );
//       }
      
//       // If not found, use the most recent incomplete stream
//       if (targetStreamIndex === -1) {
//         for (let i = match.pastStreams.length - 1; i >= 0; i--) {
//           if (!match.pastStreams[i].recordingUrl || match.pastStreams[i].uploadStatus !== 'completed') {
//             targetStreamIndex = i;
//             break;
//           }
//         }
//       }

//       // Update or create stream
//       const streamUpdate = {
//         recordingUrl,
//         fileSize: uploadResult.size,
//         mimeType: 'video/mp4', // Update to MP4
//         processed: true,
//         uploadStatus: 'completed',
//         uploadProgress: 100,
//         endedAt: new Date(),
//         imagekitFileId: uploadResult.fileId,
//         imagekitFileName: uploadResult.name,
//         imagekitFilePath: uploadResult.filePath,
//         urlAccessible: accessibilityTest.accessible,
//         videoFormat: 'mp4', // Track the format
//         lastUpdated: new Date()
//       };

//       if (targetStreamIndex !== -1) {
//         match.pastStreams[targetStreamIndex] = {
//           ...match.pastStreams[targetStreamIndex],
//           ...streamUpdate
//         };
//         console.log(`📝 Updated existing stream at index ${targetStreamIndex}`);
//       } else {
//         const newStream = {
//           roomId: match.stream?.roomId || `match_${matchId}_${Date.now()}`,
//           startedBy: req.user._id,
//           startedAt: new Date(Date.now() - 60000),
//           recordingId: recordingId || uuidv4(),
//           ...streamUpdate
//         };
//         match.pastStreams.push(newStream);
//         console.log('📝 Created new stream entry');
//       }

//       // Clear current stream
//       if (match.stream && match.stream.isLive) {
//         match.stream = {
//           isLive: false,
//           roomId: null,
//           startedBy: null,
//           startedAt: null,
//           recordingStatus: 'completed',
//           activeRecordingId: null
//         };
//       }

//       match.markModified('stream');
//       match.markModified('pastStreams');

//       await match.save();

//       console.log(`✅ Database updated successfully`);
//       console.log(`🌐 Final MP4 URL: ${recordingUrl}`);

//       res.status(200).json({
//         msg: "Recording uploaded to ImageKit successfully as MP4",
//         recordingUrl,
//         fileSize: uploadResult.size,
//         imagekitFileId: uploadResult.fileId,
//         videoFormat: 'mp4',
//         urlAccessible: accessibilityTest.accessible,
//         match: {
//           _id: match._id,
//           pastStreams: match.pastStreams.slice(-3)
//         }
//       });

//     } catch (uploadError) {
//       console.error('❌ Upload failed:', uploadError);
      
//       // Update status as failed
//       if (recordingId) {
//         try {
//           const streamIndex = match.pastStreams.findIndex(
//             stream => stream.recordingId === recordingId
//           );
//           if (streamIndex !== -1) {
//             match.pastStreams[streamIndex].uploadStatus = 'failed';
//             match.pastStreams[streamIndex].errorMessage = uploadError.message;
//             match.pastStreams[streamIndex].lastUpdated = new Date();
//             match.markModified('pastStreams');
//             await match.save();
//           }
//         } catch (saveError) {
//           console.error('Failed to update status:', saveError);
//         }
//       }
      
//       // Clean up local file
//       try {
//         if (req.file && fs.existsSync(req.file.path)) {
//           fs.unlinkSync(req.file.path);
//         }
//       } catch (cleanupError) {
//         console.error('Cleanup failed:', cleanupError);
//       }
      
//       res.status(500).json({ 
//         msg: "Failed to upload recording", 
//         error: uploadError.message 
//       });
//     }

//   } catch (err) {
//     console.error("💥 Controller error:", err);
    
//     try {
//       if (req.file && fs.existsSync(req.file.path)) {
//         fs.unlinkSync(req.file.path);
//       }
//     } catch (cleanupError) {
//       console.error('Cleanup failed:', cleanupError);
//     }
    
//     res.status(500).json({ 
//       msg: "Internal Server Error", 
//       error: err.message 
//     });
//   }
// };
// FIXED updateRecordingStatus method
customMatchController.updateRecordingStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { recordingId, status, recordingUrl, fileSize, mimeType, duration, errorMessage, uploadProgress } = req.body;

    const match = await customMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }

    // Basic auth check
    if (match.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Not authorized to update recording" });
    }

    // Initialize pastStreams array if it doesn't exist
    if (!match.pastStreams) {
      match.pastStreams = [];
    }

    // Find the pastStream with matching recordingId
    const streamIndex = match.pastStreams.findIndex(
      stream => stream.recordingId === recordingId
    );

    if (streamIndex === -1) {
      return res.status(404).json({ msg: "Recording not found in pastStreams" });
    }

    // Update the recording
    const updatedFields = {
      uploadStatus: status,
      uploadProgress: uploadProgress || (status === 'completed' ? 100 : 0),
      processed: status === 'completed' && !!recordingUrl
    };

    if (recordingUrl) updatedFields.recordingUrl = recordingUrl;
    if (fileSize) updatedFields.fileSize = fileSize;
    if (mimeType) updatedFields.mimeType = mimeType;
    if (duration) updatedFields.duration = duration;
    if (errorMessage) updatedFields.errorMessage = errorMessage;

    // Update the pastStream
    match.pastStreams[streamIndex] = {
      ...match.pastStreams[streamIndex],
      ...updatedFields
    };

    // Mark as modified to ensure save works
    match.markModified('pastStreams');

    await match.save();

    console.log(`Recording status updated for match ${matchId}, recordingId ${recordingId}: ${status}`);

    res.status(200).json({
      msg: "Recording status updated",
      match,
      recordingId,
      status,
      pastStreamsCount: match.pastStreams.length
    });

  } catch (err) {
    console.error("Error updating recording status:", err);
    res.status(500).json({ msg: "Internal Server Error", error: err.message });
  }
};


customMatchController.generatePrediction = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { predictionType } = req.body;

    const match = await customMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }

    // Use the prediction logic from the route we created
    const prediction = await generateMatchPrediction(match, predictionType);
    
    // Save to match
    match.predictions.push({
      type: 'match',
      prediction: prediction.prediction_text,
      confidence: prediction.confidence,
      winProbability: prediction.win_probability,
      timestamp: new Date()
    });

    await match.save();

    res.json({
      success: true,
      prediction: prediction.prediction_text,
      win_probability: prediction.win_probability,
      confidence: prediction.confidence,
      key_factors: prediction.key_factors,
      match_situation: prediction.match_situation
    });

  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ msg: "Prediction failed", error: err.message });
  }
};

// Auto-generate prediction on match events
customMatchController.autoGeneratePrediction = async (matchId) => {
  try {
    const match = await customMatch.findById(matchId);
    if (!match || !match.aiEnabled) return;

    // Generate prediction based on match situation
    const prediction = await generateInMatchPrediction(match);
    
    // Update AI insights
    match.aiInsights.winProbability = prediction.win_probability;
    match.aiInsights.winProbability.lastUpdated = new Date();

    // Add to predictions
    match.predictions.push({
      type: 'momentum',
      prediction: prediction.prediction_text,
      confidence: prediction.confidence,
      timestamp: new Date()
    });

    await match.save();

    // Emit socket event for live updates
    const io = require('../../index.js').io;
    if (io) {
      io.to(`match_${matchId}`).emit('prediction_update', {
        prediction: prediction.prediction_text,
        win_probability: prediction.win_probability,
        confidence: prediction.confidence
      });
    }

  } catch (error) {
    console.error('Auto-prediction failed:', error);
  }
};


customMatchController.updateBall = async (req, res) => {
  try {
    const { id } = req.params;
    const { runs, isWicket, strikerId, nonStrikerId, bowlerId, extras } = req.body;

    if (runs && (!Number.isInteger(runs) || runs < 0 || runs > 6)) {
      return res.status(400).json({ msg: "Invalid runs value" });
    }

    const match = await customMatch.findById(id);
    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }

    if (match.status === "Completed") {
      return res.status(400).json({ msg: "Match is already completed" });
    }

    if (!match.currentScore) {
      match.currentScore = {
        team: 0,
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        innings: 1,
      };
    }

    if (!match.teams || match.teams.length < 2) {
      return res.status(400).json({ msg: "Match must have at least 2 teams" });
    }

    const currentTeamIndex = match.currentScore.team;
    const currentTeam = match.teams[currentTeamIndex];
    if (!currentTeam) {
      return res.status(400).json({ msg: "Invalid team index" });
    }

    const maxWickets = (currentTeam.players?.length || 11) - 1;

    // Store original score for comparison
    const originalRuns = match.currentScore.runs;
    const originalWickets = match.currentScore.wickets;
    const originalOvers = match.currentScore.overs;
    const originalBalls = match.currentScore.balls;

    // Update runs
    if (runs && Number.isInteger(runs)) {
      match.currentScore.runs += runs;

      if (strikerId) {
        try {
          const Player = require("../models/player-model");
          await Player.findByIdAndUpdate(strikerId, { $inc: { runs } });
        } catch (err) {
          console.warn("Failed to update striker stats:", err.message);
        }
      }
    }

    // Handle wicket
    if (isWicket) {
      if (match.currentScore.wickets < maxWickets) {
        match.currentScore.wickets += 1;

        if (bowlerId) {
          try {
            const Player = require("../models/player-model");
            await Player.findByIdAndUpdate(bowlerId, { $inc: { wickets: 1 } });
          } catch (err) {
            console.warn("Failed to update bowler stats:", err.message);
          }
        }
      }
    }

    const isLegalDelivery = !extras || (extras !== 'wide' && extras !== 'no-ball');

    if (isLegalDelivery) {
      match.currentScore.balls += 1;
      if (match.currentScore.balls === 6) {
        match.currentScore.overs += 1;
        match.currentScore.balls = 0;
      }
    }

    // Calculate run rate safely (required field)
    const calculateRunRate = (runs, overs, balls) => {
      const totalOvers = overs + (balls / 6);
      return totalOvers > 0 ? parseFloat((runs / totalOvers).toFixed(2)) : 0;
    };

    // Calculate required run rate safely (optional field)
    const calculateRequiredRunRate = (match) => {
      if (match.inningsScores.length > 0 && match.currentScore.innings === 2) {
        const target = match.inningsScores[0].runs + 1;
        const required = target - match.currentScore.runs;
        const remainingBalls = (match.overs * 6) - (match.currentScore.overs * 6 + match.currentScore.balls);
        
        if (remainingBalls > 0) {
          return parseFloat(((required / remainingBalls) * 6).toFixed(2));
        }
      }
      return null;
    };

    // Create commentary entry only if something changed
    const scoreChanged = originalRuns !== match.currentScore.runs || 
                        originalWickets !== match.currentScore.wickets ||
                        originalOvers !== match.currentScore.overs ||
                        originalBalls !== match.currentScore.balls;

    if (scoreChanged) {
      // Initialize commentary array if not exists
      if (!match.commentary) {
        match.commentary = [];
      }

      // Generate simple commentary
      const generateSimpleCommentary = () => {
        if (isWicket) {
          return `🎯 Wicket! Bowler strikes and takes a crucial wicket.`;
        } else if (runs === 4) {
          return `🔴 Beautiful boundary! The ball races to the fence.`;
        } else if (runs === 6) {
          return `💥 Massive six! That's gone all the way.`;
        } else if (runs > 0) {
          return `🏃 Good running! They take ${runs} run${runs > 1 ? 's' : ''}.`;
        } else if (extras === 'wide') {
          return `Wide delivery, extra run conceded.`;
        } else if (extras === 'no-ball') {
          return `No ball! Free hit coming up.`;
        } else {
          return `Dot ball. Well bowled.`;
        }
      };

      // Determine event type based on your schema enum - FIXED: Only use valid enum values
      const determineEventType = () => {
        if (isWicket) return 'wicket';
        if (extras === 'wide' || extras === 'noball' || extras === 'byes' || extras === 'legbyes') return 'extra';
        if (runs === 0) return 'dot';
        if (runs === 4) return 'boundary';
        if (runs === 6) return 'six';
        return 'run'; // Default to 'run' for other cases
      };

      // Determine wicket type based on your schema enum
      const determineWicketType = () => {
        if (!isWicket) return null;
        // Default to 'bowled' - you can enhance this based on actual data
        return 'bowled';
      };

      // Create matchSituation object with ALL REQUIRED FIELDS
      const matchSituation = {
        runs: match.currentScore.runs || 0,
        wickets: match.currentScore.wickets || 0,
        overs: match.currentScore.overs || 0,
        balls: match.currentScore.balls || 0,
        runRate: calculateRunRate(match.currentScore.runs, match.currentScore.overs, match.currentScore.balls), // REQUIRED
        requiredRunRate: calculateRequiredRunRate(match) // Can be null
      };

      // Create event object based on your ballEventSchema - FIXED: Only use valid enum values
      const event = {
        eventType: determineEventType(), // REQUIRED - must match enum: ['dot', 'run', 'boundary', 'six', 'wicket', 'extra', 'maiden']
        runs: runs || 0,
        isWicket: isWicket || false,
        wicketType: determineWicketType(), // Must match enum: ['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket', null]
        extras: extras || null // Must match enum: ['wide', 'noball', 'byes', 'legbyes', null]
      };

      // Create commentary entry that exactly matches your schema
      const commentaryEntry = {
        ballNumber: {
          over: match.currentScore.overs || 0, // REQUIRED
          ball: match.currentScore.balls || 0  // REQUIRED
        },
        batsman: {
          id: strikerId || null,
          name: `Batsman ${strikerId ? 'A' : 'B'}`, // REQUIRED
          runs: match.currentScore.runs || 0, // Default value
          balls: 0 // Default value
        },
        bowler: {
          id: bowlerId || null,
          name: `Bowler ${bowlerId ? 'X' : 'Y'}`, // REQUIRED
          overs: match.currentScore.overs || 0, // Default value
          balls: match.currentScore.balls || 0 // Default value
        },
        event: event, // REQUIRED - must match ballEventSchema
        commentary: generateSimpleCommentary(), // REQUIRED
        matchSituation: matchSituation, // REQUIRED - must have all fields
        timestamp: new Date()
      };

      match.commentary.push(commentaryEntry);

      // FIXED: Socket.IO emission with correct path
      try {
        // Import io correctly based on your project structure
        let io;
        try {
          // Try relative path first
          io = require('../../server').io;
        } catch (relativeErr) {
          try {
            // Try absolute path
            io = require('../server').io;
          } catch (absoluteErr) {
            try {
              // Try different path
              io = require('../../index').io;
            } catch (finalErr) {
              console.log('Socket.IO not available for commentary updates');
              io = null;
            }
          }
        }
        
        if (io) {
          // Emit ball update
          io.to(`match_${match._id}`).emit('ball_update', {
            matchId: match._id,
            commentary: commentaryEntry,
            currentScore: match.currentScore
          });

          // ========== ADDED: Trigger live prediction on each ball ==========
          if (match.aiEnabled && match.status === "Live") {
            // Use setTimeout to avoid blocking the response
            setTimeout(async () => {
              try {
                const axios = require('axios');
                
                // Generate live prediction
                const predictionResponse = await axios.post(`http://localhost:3026/api/predictions/predict-live`, {
                  matchId: match._id
                }, {
                  headers: { 
                    Authorization: req.headers.authorization 
                  },
                  timeout: 30000
                });

                // Emit live prediction update to all connected clients
                if (predictionResponse.data.success) {
                  io.to(`match_${match._id}`).emit('live_prediction_update', {
                    matchId: match._id,
                    ...predictionResponse.data
                  });
                  
                  console.log(`Live prediction updated for match ${match._id}`);
                }
              } catch (predictionError) {
                console.error('Auto prediction trigger failed:', predictionError.message);
                // Don't fail the ball update if prediction fails
              }
            }, 1500); // 1.5 second delay to ensure ball is processed first
          }
          // ========== END ADDED CODE ==========
        }
      } catch (socketError) {
        console.error('Socket error (non-critical):', socketError);
        // Don't fail the entire request if socket fails
      }
    }

    // REST OF YOUR ORIGINAL LOGIC (unchanged)
    const oversCompleted = match.currentScore.overs >= match.overs;
    const allOut = match.currentScore.wickets >= maxWickets;
    const isFirstInnings = match.currentScore.innings === 1;
    const isSecondInnings = match.currentScore.innings === 2;

    const currentInningsScore = {
      team: match.currentScore.team,
      runs: match.currentScore.runs,
      wickets: match.currentScore.wickets,
      overs: match.currentScore.overs,
      balls: match.currentScore.balls,
      innings: match.currentScore.innings
    };

    if (isSecondInnings && match.inningsScores.length > 0) {
      const firstInningsScore = match.inningsScores[0];
      const targetRuns = firstInningsScore.runs + 1;

      if (match.currentScore.runs >= targetRuns) {
        const remainingWickets = maxWickets - match.currentScore.wickets;
        const chasingTeam = match.teams[match.currentScore.team]?.name || "Team 2";

        match.status = "Completed";
        match.result = `${chasingTeam} won by ${remainingWickets} wickets`;

        const existingIndex = match.inningsScores.findIndex(s => s.innings === match.currentScore.innings);
        if (existingIndex !== -1) {
          match.inningsScores[existingIndex] = currentInningsScore;
        } else {
          match.inningsScores.push(currentInningsScore);
        }

        // Add match completion commentary - FIXED: Use valid eventType
        if (match.commentary) {
          const completionCommentary = {
            ballNumber: { over: match.currentScore.overs, ball: match.currentScore.balls },
            batsman: { name: "Match Complete", runs: 0, balls: 0 },
            bowler: { name: "Match Complete", overs: 0, balls: 0 },
            event: { 
              eventType: 'wicket', // Use valid enum value instead of 'match_complete'
              runs: 0, 
              isWicket: false,
              wicketType: null,
              extras: null
            },
            commentary: `🎉 MATCH OVER! ${match.result}`,
            matchSituation: {
              runs: match.currentScore.runs,
              wickets: match.currentScore.wickets,
              overs: match.currentScore.overs,
              balls: match.currentScore.balls,
              runRate: calculateRunRate(match.currentScore.runs, match.currentScore.overs, match.currentScore.balls),
              requiredRunRate: null
            },
            timestamp: new Date()
          };
          match.commentary.push(completionCommentary);
        }

        await match.save();
        return res.json(match);
      }
    }

    if (oversCompleted || allOut) {
      const existingIndex = match.inningsScores.findIndex(s => s.innings === match.currentScore.innings);
      if (existingIndex !== -1) {
        match.inningsScores[existingIndex] = currentInningsScore;
      } else {
        match.inningsScores.push(currentInningsScore);
      }

      if (isFirstInnings) {
        match.currentScore = {
          team: match.currentScore.team === 0 ? 1 : 0,
          runs: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          innings: 2
        };
        match.status = "Live";

        // Add innings break commentary - FIXED: Use valid eventType
        if (match.commentary) {
          const inningsBreakCommentary = {
            ballNumber: { over: 0, ball: 0 },
            batsman: { name: "Innings Break", runs: 0, balls: 0 },
            bowler: { name: "Innings Break", overs: 0, balls: 0 },
            event: { 
              eventType: 'dot', // Use valid enum value instead of 'innings_break'
              runs: 0, 
              isWicket: false,
              wicketType: null,
              extras: null
            },
            commentary: `🏏 END OF INNINGS! ${currentTeam.name} scored ${currentInningsScore.runs}/${currentInningsScore.wickets}. Target: ${currentInningsScore.runs + 1} runs.`,
            matchSituation: {
              runs: currentInningsScore.runs,
              wickets: currentInningsScore.wickets,
              overs: currentInningsScore.overs,
              balls: currentInningsScore.balls,
              runRate: calculateRunRate(currentInningsScore.runs, currentInningsScore.overs, currentInningsScore.balls),
              requiredRunRate: null
            },
            timestamp: new Date()
          };
          match.commentary.push(inningsBreakCommentary);
        }
      } else {
        match.status = "Completed";

        const firstInnings = match.inningsScores.find(s => s.innings === 1);
        const secondInnings = currentInningsScore;

        if (!firstInnings) {
          return res.status(500).json({ msg: "First innings data not found" });
        }

        const team1Name = match.teams[firstInnings.team]?.name || "Team 1";
        const team2Name = match.teams[secondInnings.team]?.name || "Team 2";

        if (firstInnings.runs > secondInnings.runs) {
          const margin = firstInnings.runs - secondInnings.runs;
          match.result = `${team1Name} won by ${margin} runs`;
        } else if (secondInnings.runs > firstInnings.runs) {
          const remainingWickets = maxWickets - secondInnings.wickets;
          match.result = `${team2Name} won by ${remainingWickets} wickets`;
        } else {
          match.result = "Match tied";
        }

        // Add match completion commentary - FIXED: Use valid eventType
        if (match.commentary) {
          const completionCommentary = {
            ballNumber: { over: match.currentScore.overs, ball: match.currentScore.balls },
            batsman: { name: "Match Complete", runs: 0, balls: 0 },
            bowler: { name: "Match Complete", overs: 0, balls: 0 },
            event: { 
              eventType: 'wicket', // Use valid enum value instead of 'match_complete'
              runs: 0, 
              isWicket: false,
              wicketType: null,
              extras: null
            },
            commentary: `🎉 MATCH OVER! ${match.result}`,
            matchSituation: {
              runs: match.currentScore.runs,
              wickets: match.currentScore.wickets,
              overs: match.currentScore.overs,
              balls: match.currentScore.balls,
              runRate: calculateRunRate(match.currentScore.runs, match.currentScore.overs, match.currentScore.balls),
              requiredRunRate: null
            },
            timestamp: new Date()
          };
          match.commentary.push(completionCommentary);
        }
      }
    } else {
      const existingIndex = match.inningsScores.findIndex(s => s.innings === match.currentScore.innings);
      if (existingIndex !== -1) {
        match.inningsScores[existingIndex] = currentInningsScore;
      } else {
        match.inningsScores.push(currentInningsScore);
      }
    }

    await match.save();
    
    // Return match with commentary included
    res.json(match);

  } catch (err) {
    console.error("Ball update error:", err.message);
    res.status(500).json({ msg: "Internal server error", error: err.message });
  }
};

customMatchController.getMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const match = await customMatch.findById(id);
    
    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }
    
    res.json(match);
  } catch (err) {
    console.error("Get match error:", err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};

customMatchController.getAllMatches = async (req, res) => {
  try {
    const matches = await customMatch.find().sort({ createdAt: -1 });
    res.json(matches);
  } catch (err) {
    console.error("Get all matches error:", err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};

customMatchController.deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const match = await customMatch.findByIdAndDelete(id);
    
    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }
    
    res.json({ msg: "Match deleted successfully" });
  } catch (err) {
    console.error("Delete match error:", err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// customMatchController.updateMatchResult = async(req,res) => {
//   const {matchId,winnerTeamName} = req.body;
//   try{
    
//     const match = await customMatch.findById(matchId);
//     if(!match){
//       return res.status(404).json({error:"Match not found"});
//     }
//     match.result = winnerTeamName,
//     match.status = "Completed",
//     await match.save();

//     //update teams stats --------
//     for(const team of match.teams){
//       const teamDoc = await Team.findOne({name: team.name})

//       teamDoc.matchesPlayed += 1;
//       if (team.name === winnerTeamName) {
//         teamDoc.wins += 1;
//         teamDoc.points += 2;
//       } else {
//         teamDoc.losses += 1;
//       }

//       await teamDoc.save();
//     }
//     res.status(200).json({ message: "Match finalized and team stats updated." });
//     }
//   catch(err){
//     return res.status(500).json("Internal Server error",err);
//   }
// }

// Fixed Custom Match Controller - updateMatchResult
customMatchController.updateMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params; // Get from URL params
    const { winnerTeamName } = req.body;

    if (!matchId || !winnerTeamName) {
      return res.status(400).json({ error: "Match ID and winner team name are required" });
    }

    const match = await customMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Update match result
    match.result = `${winnerTeamName} won`;
    match.status = "Completed";
    await match.save();

    // Update team stats
    const updatePromises = match.teams.map(async (team) => {
      try {
        const teamDoc = await Team.findOne({ name: team.name });
        
        if (teamDoc) {
          teamDoc.matchesPlayed += 1;
          
          if (team.name === winnerTeamName) {
            teamDoc.wins += 1;
            teamDoc.points += 2; // 2 points for a win
          } else {
            teamDoc.losses += 1;
            // 0 points for a loss
          }
          
          await teamDoc.save();
          console.log(`Updated stats for ${team.name}`);
        } else {
          console.warn(`Team not found: ${team.name}`);
        }
      } catch (teamError) {
        console.error(`Error updating team ${team.name}:`, teamError);
      }
    });

    // Wait for all team updates to complete
    await Promise.all(updatePromises);

    res.status(200).json({ 
      message: "Match finalized and team stats updated successfully",
      match: match
    });
    
  } catch (err) {
    console.error('Error updating match result:', err);
    res.status(500).json({ error: "Internal server error" });
  }
};



module.exports = {
  ...customMatchController,
  uploadMiddleware: upload
};
