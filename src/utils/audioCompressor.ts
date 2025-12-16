import lamejs from 'lamejs';

const MAX_SIZE_MB = 24; // Compress if larger than 24MB
const TARGET_BITRATE = 64; // Target bitrate in kbps for compressed audio

export interface CompressionResult {
  file: File;
  wasCompressed: boolean;
  originalSize: number;
  compressedSize: number;
}

/**
 * Decode audio file to AudioBuffer using Web Audio API
 */
async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    await audioContext.close();
  }
}

/**
 * Convert AudioBuffer to MP3 using lamejs
 */
function encodeToMp3(audioBuffer: AudioBuffer, bitrate: number = TARGET_BITRATE): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.length;
  
  // Get audio data - convert to mono if stereo for smaller size
  let leftChannel: Float32Array;
  let rightChannel: Float32Array | null = null;
  
  if (numChannels === 1) {
    leftChannel = audioBuffer.getChannelData(0);
  } else {
    leftChannel = audioBuffer.getChannelData(0);
    rightChannel = audioBuffer.getChannelData(1);
  }
  
  // Convert float samples to int16
  const leftInt16 = floatTo16BitPCM(leftChannel);
  const rightInt16 = rightChannel ? floatTo16BitPCM(rightChannel) : null;
  
  // Initialize MP3 encoder
  const mp3encoder = new lamejs.Mp3Encoder(rightInt16 ? 2 : 1, sampleRate, bitrate);
  
  const mp3Data: ArrayBuffer[] = [];
  const blockSize = 1152; // Must be multiple of 576 for lamejs
  
  for (let i = 0; i < samples; i += blockSize) {
    const leftChunk = leftInt16.subarray(i, i + blockSize);
    
    let mp3buf: Int8Array;
    if (rightInt16) {
      const rightChunk = rightInt16.subarray(i, i + blockSize);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }
    
    if (mp3buf.length > 0) {
      // Convert to ArrayBuffer for Blob compatibility
      const buffer = new ArrayBuffer(mp3buf.length);
      const view = new Uint8Array(buffer);
      for (let j = 0; j < mp3buf.length; j++) {
        view[j] = mp3buf[j] & 0xff;
      }
      mp3Data.push(buffer);
    }
  }
  
  // Flush remaining data
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    const buffer = new ArrayBuffer(mp3buf.length);
    const view = new Uint8Array(buffer);
    for (let j = 0; j < mp3buf.length; j++) {
      view[j] = mp3buf[j] & 0xff;
    }
    mp3Data.push(buffer);
  }
  
  return new Blob(mp3Data, { type: 'audio/mpeg' });
}

/**
 * Convert Float32Array to Int16Array for MP3 encoding
 */
function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

/**
 * Compress audio file if it exceeds the size limit
 */
export async function compressAudioIfNeeded(
  file: File,
  onProgress?: (status: string) => void
): Promise<CompressionResult> {
  const originalSize = file.size;
  const sizeMB = originalSize / (1024 * 1024);
  
  // If file is small enough, return as-is
  if (sizeMB <= MAX_SIZE_MB) {
    return {
      file,
      wasCompressed: false,
      originalSize,
      compressedSize: originalSize,
    };
  }
  
  onProgress?.('Decodificando audio...');
  
  try {
    // Decode the audio file
    const audioBuffer = await decodeAudioFile(file);
    
    onProgress?.('Comprimiendo audio...');
    
    // Calculate target bitrate based on desired output size
    // Target ~20MB output for safety margin
    const durationSecs = audioBuffer.duration;
    const targetSizeBytes = 20 * 1024 * 1024; // 20MB
    let targetBitrate = Math.floor((targetSizeBytes * 8) / durationSecs / 1000);
    
    // Clamp bitrate between 32 and 128 kbps
    targetBitrate = Math.max(32, Math.min(128, targetBitrate));
    
    console.log(`Compressing: duration=${durationSecs.toFixed(1)}s, targetBitrate=${targetBitrate}kbps`);
    
    // Encode to MP3
    const compressedBlob = encodeToMp3(audioBuffer, targetBitrate);
    
    // Create new file with compressed data
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, '_compressed.mp3'),
      { type: 'audio/mpeg' }
    );
    
    onProgress?.('Compresión completada');
    
    console.log(`Compression complete: ${(originalSize/1024/1024).toFixed(1)}MB -> ${(compressedFile.size/1024/1024).toFixed(1)}MB`);
    
    return {
      file: compressedFile,
      wasCompressed: true,
      originalSize,
      compressedSize: compressedFile.size,
    };
  } catch (error) {
    console.error('Audio compression failed:', error);
    throw new Error('No se pudo comprimir el audio. Intenta con un archivo más pequeño.');
  }
}
