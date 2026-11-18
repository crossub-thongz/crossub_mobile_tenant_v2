import * as ImagePicker from 'expo-image-picker';

import type { EvidenceFile } from '@/src/api/tenant';

function toEvidence(asset: ImagePicker.ImagePickerAsset, index = 0): EvidenceFile {
  if (!asset.base64) throw new Error('Could not read that file. Choose another photo or video.');
  const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
  const fallback = mimeType.startsWith('video/') ? 'clip.mp4' : `photo-${index + 1}.jpg`;
  return {
    fileName: asset.fileName || fallback,
    mimeType,
    contentBase64: asset.base64,
    sizeBytes: asset.fileSize,
    previewUri: asset.uri,
  };
}

export async function pickEvidence(): Promise<EvidenceFile | null> {
  const files = await pickEvidenceMany(1);
  return files[0] ?? null;
}

/** Library picker. `limit` is the most files this call may return. */
export async function pickEvidenceMany(limit: number): Promise<EvidenceFile[]> {
  if (limit < 1) return [];
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library access is required to upload this file.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    base64: true,
    quality: 0.7,
  });
  if (result.canceled || result.assets.length === 0) return [];
  return result.assets.slice(0, limit).map((asset, index) => toEvidence(asset, index));
}

/** Opens the camera for a still photo. The library picker remains available for existing photos and video. */
export async function captureEvidence(): Promise<EvidenceFile | null> {
  const files = await captureEvidenceBatch(1);
  return files[0] ?? null;
}

/**
 * Opens the camera once per photo, up to `limit`. Cancel stops the run and keeps the photos already taken.
 * The phone camera sheet itself only returns one picture, so the next shot opens as soon as the last one is saved.
 */
export async function captureEvidenceBatch(limit: number): Promise<EvidenceFile[]> {
  if (limit < 1) return [];
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Camera access is required to take a photo.');
  const files: EvidenceFile[] = [];
  while (files.length < limit) {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.7,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/simulator|unavailable|not available|camera/i.test(message)) {
        throw new Error('The camera is not available on this device. Add a photo from your library instead.');
      }
      throw err;
    }
    if (result.canceled || !result.assets[0]) break;
    files.push(toEvidence(result.assets[0], files.length));
  }
  return files;
}
