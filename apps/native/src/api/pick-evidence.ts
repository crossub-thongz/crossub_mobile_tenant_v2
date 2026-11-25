import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import type { EvidenceFile } from '@/src/api/tenant';

/**
 * The repair upload accepts 25 MB decoded. Stay under that, because base64 makes the
 * JSON body about a third larger. iOS compresses the clip to medium H.264 before we read it.
 * A clip that is still over this limit is refused rather than sent.
 */
const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;
const VIDEO_MAX_SECONDS = 60;

const VIDEO_OPTIONS = {
  videoMaxDuration: VIDEO_MAX_SECONDS,
  videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
  videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
} as const;

function isVideo(asset: ImagePicker.ImagePickerAsset): boolean {
  return asset.type === 'video' || (asset.mimeType ?? '').startsWith('video/');
}

async function fileBytes(uri: string, fallback?: number | null): Promise<number> {
  if (fallback && fallback > 0) return fallback;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && typeof info.size === 'number') return info.size;
  return 0;
}

async function toEvidence(asset: ImagePicker.ImagePickerAsset, index = 0): Promise<EvidenceFile> {
  const video = isVideo(asset);
  const mimeType = asset.mimeType || (video ? 'video/mp4' : 'image/jpeg');
  const size = await fileBytes(asset.uri, asset.fileSize);
  if (size > MAX_EVIDENCE_BYTES) {
    throw new Error(
      video ? 'That video is too large to send. Record a shorter clip.' : 'That photo is too large. Choose a smaller one.',
    );
  }
  let contentBase64 = asset.base64 ?? '';
  if (!contentBase64) {
    if (!asset.uri) throw new Error('Could not read that file. Choose another photo or video.');
    contentBase64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
  }
  if (!contentBase64) throw new Error('Could not read that file. Choose another photo or video.');
  const decoded = size || Math.floor((contentBase64.length * 3) / 4);
  if (decoded > MAX_EVIDENCE_BYTES) {
    throw new Error(
      video ? 'That video is too large to send. Record a shorter clip.' : 'That photo is too large. Choose a smaller one.',
    );
  }
  return {
    fileName: asset.fileName || (video ? 'clip.mp4' : `photo-${index + 1}.jpg`),
    mimeType,
    contentBase64,
    sizeBytes: decoded,
    previewUri: asset.uri,
  };
}

export async function pickEvidence(): Promise<EvidenceFile | null> {
  const files = await pickEvidenceMany(1);
  return files[0] ?? null;
}

type PickOptions = { quality?: number; imagesOnly?: boolean };

/** Library picker. `limit` is the most files this call may return. Photos and videos both come back from this button. */
export async function pickEvidenceMany(limit: number, options?: PickOptions): Promise<EvidenceFile[]> {
  if (limit < 1) return [];
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library access is required to upload this file.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: options?.imagesOnly ? ['images'] : ['images', 'videos'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    base64: true,
    quality: options?.quality ?? 0.7,
    ...(options?.imagesOnly ? {} : VIDEO_OPTIONS),
  });
  if (result.canceled || result.assets.length === 0) return [];
  const files: EvidenceFile[] = [];
  for (const [index, asset] of result.assets.slice(0, limit).entries()) {
    files.push(await toEvidence(asset, index));
  }
  return files;
}

/** Opens the camera for a still photo. The library picker remains available for existing photos and video. */
export async function captureEvidence(): Promise<EvidenceFile | null> {
  const files = await captureEvidenceBatch(1);
  return files[0] ?? null;
}

/**
 * Opens the camera once per photo or video, up to `limit`. Cancel stops the run and keeps what was already taken.
 * The camera sheet returns one item, so the next shot opens as soon as the last one is saved. A video ends the run.
 */
export async function captureEvidenceBatch(limit: number, options?: PickOptions): Promise<EvidenceFile[]> {
  if (limit < 1) return [];
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Camera access is required to take a photo or video.');
  const files: EvidenceFile[] = [];
  while (files.length < limit) {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: options?.imagesOnly ? ['images'] : ['images', 'videos'],
        base64: true,
        quality: options?.quality ?? 0.7,
        ...(options?.imagesOnly ? {} : VIDEO_OPTIONS),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/simulator|unavailable|not available|camera/i.test(message)) {
        throw new Error('The camera is not available on this device. Add a photo or video from your library instead.');
      }
      throw err;
    }
    if (result.canceled || !result.assets[0]) break;
    const asset = result.assets[0];
    files.push(await toEvidence(asset, files.length));
    if (isVideo(asset)) break;
  }
  return files;
}
