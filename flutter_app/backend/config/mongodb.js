import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let bucket;

// Initialize GridFS bucket after MongoDB connection is established
mongoose.connection.once('open', () => {
  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'files'
  });
});

export { bucket }; 