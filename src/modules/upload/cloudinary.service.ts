import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    publicId?: string
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'avatars',
            public_id: publicId,
            overwrite: true,
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) {
              return reject(new InternalServerErrorException('Upload failed: no result'));
            }
            resolve(result);
          }
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete image from Cloudinary');
    }
  }
}
