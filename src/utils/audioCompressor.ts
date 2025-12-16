import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const MAX_SIZE_MB = 24; // Compress if larger than 24MB

export interface CompressionResult {
  file: File;
  wasCompressed: boolean;
  originalSize: number;
  compressedSize: number;
}

let ffmpeg: FFmpeg | null = null;

/**
 * Load FFmpeg WASM (lazy loading, only when needed)
 */
async function loadFFmpeg(onProgress?: (status: string) => void): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) {
    return ffmpeg;
  }
  
  onProgress?.('Cargando compresor de audio...');
  
  ffmpeg = new FFmpeg();
  
  // Load FFmpeg from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  
  return ffmpeg;
}

/**
 * Compress audio file if it exceeds the size limit using FFmpeg
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
  
  try {
    const ff = await loadFFmpeg(onProgress);
    
    onProgress?.('Procesando audio...');
    
    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const inputName = `input.${extension}`;
    const outputName = 'output.mp3';
    
    // Calculate target bitrate based on desired output size (~20MB for safety)
    // Estimate: bitrate = (target_size_bytes * 8) / duration_seconds / 1000
    // Since we don't know duration yet, use a conservative estimate
    // For a 100MB file that's ~40 minutes, targeting 20MB = ~64kbps
    const targetBitrate = Math.max(32, Math.min(96, Math.floor((20 * 8) / (sizeMB / 2))));
    
    console.log(`Compressing audio: ${sizeMB.toFixed(1)}MB -> target bitrate: ${targetBitrate}kbps`);
    
    // Write input file to FFmpeg virtual filesystem
    await ff.writeFile(inputName, await fetchFile(file));
    
    onProgress?.('Comprimiendo audio...');
    
    // Run FFmpeg compression
    // -i: input file
    // -b:a: audio bitrate
    // -ac 1: convert to mono
    // -ar 16000: sample rate 16kHz (good enough for speech)
    await ff.exec([
      '-i', inputName,
      '-b:a', `${targetBitrate}k`,
      '-ac', '1',
      '-ar', '16000',
      '-y', // overwrite output
      outputName
    ]);
    
    // Read compressed output
    const compressedData = await ff.readFile(outputName);
    
    // Clean up virtual filesystem
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
    
    // Convert to ArrayBuffer for Blob compatibility
    let arrayBuffer: ArrayBuffer;
    if (compressedData instanceof Uint8Array) {
      // Create a new ArrayBuffer and copy data to ensure compatibility
      arrayBuffer = new ArrayBuffer(compressedData.byteLength);
      new Uint8Array(arrayBuffer).set(compressedData);
    } else {
      // It's a string, convert to ArrayBuffer
      const encoder = new TextEncoder();
      arrayBuffer = encoder.encode(compressedData as string).buffer as ArrayBuffer;
    }
    
    // Create new file
    const compressedBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, '_compressed.mp3'),
      { type: 'audio/mpeg' }
    );
    
    onProgress?.('Compresión completada');
    
    console.log(`Compression complete: ${sizeMB.toFixed(1)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`);
    
    return {
      file: compressedFile,
      wasCompressed: true,
      originalSize,
      compressedSize: compressedFile.size,
    };
  } catch (error) {
    console.error('Audio compression failed:', error);
    throw new Error('No se pudo comprimir el audio. Intenta con un archivo más pequeño o usa la opción de transcripción.');
  }
}
