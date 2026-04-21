import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { getUserPhotos, addUserPhoto, deleteUserPhoto } from '../services/photo.service';

const addPhotoSchema = z.object({
  url: z.string().min(1), // Accepts URLs and data URIs (base64)
});

export const getMyPhotosController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const photos = await getUserPhotos(req.user!.id);
    res.json({ photos });
  } catch (error) {
    next(error);
  }
};

export const addPhotoController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = addPhotoSchema.parse(req.body);
    const photo = await addUserPhoto(req.user!.id, url);
    res.status(201).json(photo);
  } catch (error) {
    next(error);
  }
};

export const deletePhotoController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await deleteUserPhoto(req.user!.id, req.params.photoId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
