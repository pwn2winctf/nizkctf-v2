import libsodium from 'libsodium-wrappers'

export async function randomString (size: number): Promise<string> {
  await libsodium.ready
  return libsodium.randombytes_buf(size, 'hex').toLowerCase()
}

export async function cryptoSignSeedKeypair (
  seed: Uint8Array
): Promise<libsodium.KeyPair> {
  await libsodium.ready
  return await libsodium.crypto_sign_seed_keypair(seed)
}

export async function cryptoSign (
  message: string | Uint8Array,
  privateKey: Uint8Array
): Promise<Uint8Array> {
  await libsodium.ready
  return await libsodium.crypto_sign(message, privateKey)
}

export async function cryptoSignOpen (
  signedMessage: string | Uint8Array,
  publicKey: Uint8Array
): Promise<Uint8Array> {
  await libsodium.ready
  return await libsodium.crypto_sign_open(signedMessage, publicKey)
}

export async function cryptoPwHash (password: string, salt: Uint8Array, opslimit: number, memlimit: number): Promise<Uint8Array> {
  await libsodium.ready

  const data = await libsodium.crypto_pwhash(
    libsodium.crypto_sign_SEEDBYTES,
    password,
    salt,
    opslimit,
    memlimit,
    libsodium.crypto_pwhash_ALG_ARGON2ID13
  )

  return data
}
