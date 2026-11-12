import * as ImagePicker from 'expo-image-picker';

import type { EvidenceFile } from '@/src/api/tenant';

export async function pickEvidence(): Promise<EvidenceFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library access is required to upload this file.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    base64: true,
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) throw new Error('Could not read that file. Choose another photo or video.');
  const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
  const fileName = asset.fileName || (mimeType.startsWith('video/') ? 'clip.mp4' : 'photo.jpg');
  return { fileName, mimeType, contentBase64: asset.base64, sizeBytes: asset.fileSize };
}
