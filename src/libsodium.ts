import libsodium from 'libsodium-wrappers'

export interface TeamKeys {
  cryptPk: string
  cryptSk: string
  signPk: string
  signSk: string
}

export async function createTeamKeys (): Promise<TeamKeys> {
  await libsodium.ready

  const {
    publicKey: cryptPk,
    privateKey: cryptSk
  } = await libsodium.crypto_box_keypair()
  const {
    publicKey: signPk,
    privateKey: signSk
  } = await libsodium.crypto_sign_keypair()

  return {
    cryptPk: Buffer.from(cryptPk).toString('base64'),
    cryptSk: Buffer.from(cryptSk).toString('base64'),
    signPk: Buffer.from(signPk).toString('base64'),
    signSk: Buffer.from(signSk).toString('base64')
  }
}

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
