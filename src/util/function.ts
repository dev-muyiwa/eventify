export function generateUUIDv7() {
  const now = Date.now();
  const timestamp = BigInt(now) << 16n;

  const uuid = new Uint8Array(16);
  const tmsArray = new DataView(new ArrayBuffer(8));
  tmsArray.setBigUint64(0, timestamp, false);

  uuid.set(new Uint8Array(tmsArray.buffer).slice(0, 6), 0);

  crypto.getRandomValues(uuid.subarray(6, 16));

  uuid[6] = (uuid[6] & 0x0f) | 0x70;
  uuid[8] = (uuid[8] & 0x3f) | 0x80;

  return `${[...uuid].map((b, i) => (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') + b.toString(16).padStart(2, '0')).join('')}`;
}

export interface Response<T> {
  success: boolean;
  data: T | null;
  message: string;
}

interface ErrorResponse<T> {
  success: boolean;
  error: T | null;
  message: string;
}

export function success<T>(
  data: T,
  message: string = 'Request was successful',
): Response<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function error(message: string, err?: any): ErrorResponse<null> {
  return {
    success: false,
    error: err ? err : null,
    message,
  };
}
