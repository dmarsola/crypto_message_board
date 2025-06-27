# Crypto Message Board

This is a cryptography exercise.
At Irdeto I had the honor of working with brilliant cryptographers who cared enough to share some their knowledge.

## Message Board types

- Private Board = Anyone can write (by encrypting with public key), only owner can read (by decrypting with private key).
- Public Board = Anyone can read (cleartext), only owner can write (by signing).

## Private Message Board:

### Asymmetric Encryption (confidentiality)

Purpose: Encrypt data so that only the holder of a private key can decrypt it.

**How it works:** The sender encrypts the message using the recipient's public encryption key. Only the recipient’s private encryption key can decrypt the messages.

**Use in this app:** This approach is used in the Private Message Board to keep messages secret. Anyone can encrypt a message to the board using the public key. However, only the owner, with the private key, can decrypt and read the messages.

## Public Message Board:

### Digital Signatures (authentication, integrity)

Purpose: Prove that a message came from the holder of a private key, and that it wasn't tampered with while in transit.

**How it works:** The sender creates a signature of the message using their private signing key. Anyone can verify that signature using the public key.

**Use in this app:** This approach is used in the Public Message Board to authorize posts and validate posts before saving them. Only someone with the private key (derived from the secret word, secret code and special date) can sign. The system verifies the signature against the board’s public key.
