import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';

// Function to derive a public key from a private key (secret key)
export const isValidSolanaPrivateKey = (input: string | any ): string | null => {
    try {
      // Try decoding from Base58 (the common format for Solana private keys)
      const decodedKey = bs58.decode(input);
  
      // A valid private key should be 64 bytes
      if (decodedKey.length !== 64) {
        // If any errors occur (e.g., decoding issues), the input is invalid
        // console.error('Error deriving public key from private key:', error);
        return null;
      }
  
      // Further validation: Try generating a keypair using the private key
      const keyPair = nacl.sign.keyPair.fromSecretKey(decodedKey);
      // Get the public key as a string
      const publicKey = new PublicKey(keyPair.publicKey).toBase58();
      // If the keypair was successfully generated, it's a valid private key
      return publicKey;
    } catch (error) {
      // If any errors occur (e.g., decoding issues), the input is invalid
      console.error('Error deriving public key from private key:', error);
      return null;
    }
};
