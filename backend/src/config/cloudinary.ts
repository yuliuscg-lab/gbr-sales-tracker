import { v2 as cloudinary, UploadApiResponse} from "cloudinary";
import { AppError } from "../errors/AppError";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadBufferToCloudinary = (
    fileBuffer: Buffer,
    folder: string
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder:`event-management/${folder}`,
                transformation: [{ width: 1000, crop: "limit"}],
            },
            (error, result) => {
                if (error || !result) {
                    return reject(new AppError(error?.message || "Gagal upload ke Cloudinary",500));
                }
                resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
}