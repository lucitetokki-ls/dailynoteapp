const encoder = new TextEncoder();
const decoder = new TextDecoder();
const iterations = 310_000;
const minimumIterations = 100_000;
const maximumIterations = 1_000_000;
const saltBytes = 16;
const ivBytes = 12;
const authenticationTagBytes = 16;
const maximumCiphertextBytes = 5 * 1024 * 1024;
const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export type EncryptedDailyNoteBackup = {
  app: "daily-note-app-encrypted";
  version: 1;
  algorithm: "AES-GCM";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 32_768;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function isSupportedIterationCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimumIterations &&
    value <= maximumIterations
  );
}

function getBase64ByteLength(value: string) {
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return (value.length * 3) / 4 - padding;
}

function isBase64WithByteLength(value: unknown, minimum: number, maximum: number) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length % 4 !== 0 ||
    !base64Pattern.test(value)
  ) {
    return false;
  }

  const byteLength = getBase64ByteLength(value);
  return byteLength >= minimum && byteLength <= maximum;
}

async function deriveKey(passphrase: string, salt: Uint8Array, rounds: number) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: rounds },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function isEncryptedDailyNoteBackup(value: unknown): value is EncryptedDailyNoteBackup {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<EncryptedDailyNoteBackup>;
  return (
    candidate.app === "daily-note-app-encrypted" &&
    candidate.version === 1 &&
    candidate.algorithm === "AES-GCM" &&
    isSupportedIterationCount(candidate.iterations) &&
    isBase64WithByteLength(candidate.salt, saltBytes, saltBytes) &&
    isBase64WithByteLength(candidate.iv, ivBytes, ivBytes) &&
    isBase64WithByteLength(
      candidate.ciphertext,
      authenticationTagBytes,
      maximumCiphertextBytes,
    )
  );
}

export async function encryptDailyNoteBackup(value: unknown, passphrase: string) {
  if (passphrase.length < 8) {
    throw new Error("Backup passphrase must contain at least 8 characters.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, iterations);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encoder.encode(JSON.stringify(value)),
  );

  return {
    app: "daily-note-app-encrypted",
    version: 1,
    algorithm: "AES-GCM",
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  } satisfies EncryptedDailyNoteBackup;
}

export async function decryptDailyNoteBackup(
  value: EncryptedDailyNoteBackup,
  passphrase: string,
) {
  if (!isEncryptedDailyNoteBackup(value)) {
    throw new Error("Invalid encrypted backup format.");
  }

  if (!passphrase) {
    throw new Error("A passphrase is required for this backup.");
  }

  const salt = base64ToBytes(value.salt);
  const iv = base64ToBytes(value.iv);
  const ciphertext = base64ToBytes(value.ciphertext);
  const key = await deriveKey(passphrase, salt, value.iterations);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );

  return JSON.parse(decoder.decode(decrypted)) as unknown;
}
