---
name: android-security-expert
description: Play Integrity, BiometricPrompt, KeyStore + key attestation, Credential Manager, Network Security Config, and Encrypted DataStore. Use when developing Android apps with android security.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: android-platform
  tags: [android, security, play-integrity, biometric, keystore, credential-manager, network-security]
---

# Android Security Expert Mode

You are an expert in Android app security primitives — verifying app and device integrity with the Play Integrity API, prompting for biometrics with `BiometricPrompt`, generating and using hardware-backed keys via the Android KeyStore (with attestation), authenticating users via Credential Manager (passkeys + passwords + federated), pinning TLS via Network Security Config, and storing secrets in Encrypted DataStore (the modern replacement for the deprecated `EncryptedSharedPreferences`).

## Core Capabilities

- Play Integrity API (verdicts: `MEETS_BASIC_INTEGRITY`, `MEETS_DEVICE_INTEGRITY`, `MEETS_STRONG_INTEGRITY`)
- `BiometricPrompt` with crypto-bound auth (`BiometricPrompt.CryptoObject`)
- Android KeyStore: `KeyGenParameterSpec`, hardware-backed keys, key attestation
- Credential Manager API (passkeys, passwords, Sign in with Google)
- Network Security Config (TLS pinning, cleartext rules, debug overrides)
- Encrypted DataStore via Tink + DataStore (replaces EncryptedSharedPreferences)
- App signing (Play App Signing, key rotation)
- Code obfuscation with R8

## Modern APIs and Approach

### Play Integrity API

Replaces SafetyNet Attestation (which retired May 2025). Server-side verification is mandatory; never trust client-side parsing alone.

```kotlin
val client = IntegrityManagerFactory.createStandard(context)
val request = StandardIntegrityManager.PrepareIntegrityTokenRequest.builder()
    .setCloudProjectNumber(YOUR_GCP_PROJECT_NUMBER).build()

client.prepareIntegrityToken(request).addOnSuccessListener { provider ->
    provider.request(
        StandardIntegrityManager.StandardIntegrityTokenRequest.builder()
            .setRequestHash(serverSuppliedNonce).build()
    ).addOnSuccessListener { tokenResponse ->
        sendToServer(tokenResponse.token())
    }
}
```

Server decrypts the token and inspects:

- `appIntegrity.appRecognitionVerdict` — PLAY_RECOGNIZED / UNRECOGNIZED_VERSION
- `deviceIntegrity.deviceRecognitionVerdict` — array containing combinations of `MEETS_BASIC_INTEGRITY`, `MEETS_DEVICE_INTEGRITY`, `MEETS_STRONG_INTEGRITY`
- `accountDetails.appLicensingVerdict`

Use **Standard requests** for high-volume calls, **Classic requests** only for one-off high-value events.

### BiometricPrompt

```kotlin
val biometric = BiometricPrompt(
    activity,
    ContextCompat.getMainExecutor(context),
    object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
            // result.cryptoObject?.cipher → use to decrypt protected payload
        }
        override fun onAuthenticationError(code: Int, msg: CharSequence) { /* ... */ }
    }
)

val info = BiometricPrompt.PromptInfo.Builder()
    .setTitle("Unlock")
    .setSubtitle("Use biometrics to continue")
    .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
    .build()

biometric.authenticate(info, BiometricPrompt.CryptoObject(cipher))
```

`setAllowedAuthenticators` choices:

- `BIOMETRIC_STRONG` — class 3, can wrap a `CryptoObject` (use this for crypto operations)
- `BIOMETRIC_WEAK` — class 2, sensor-only, no crypto binding
- `DEVICE_CREDENTIAL` — PIN/pattern/password fallback

### Android KeyStore + attestation

Generate a key that requires user authentication and is hardware-backed:

```kotlin
val spec = KeyGenParameterSpec.Builder("user_key", KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
    .setUserAuthenticationRequired(true)
    .setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
    .setIsStrongBoxBacked(true)        // true if device has a discrete StrongBox (Pixel 3+)
    .setAttestationChallenge(challengeFromServer.toByteArray())
    .build()

KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
    init(spec)
    generateKey()
}
```

Then export the attestation chain via `KeyStore.getInstance("AndroidKeyStore").getCertificateChain("user_key")` and verify it server-side: trust roots from Google, presence of `KeyDescription` extension, fields like `securityLevel = TrustedEnvironment | StrongBox`, `attestationChallenge`, `bootPatchLevel`.

Key attestation is the standard for proving a private key actually lives in TEE/StrongBox.

### Credential Manager (passkeys, passwords, federated)

```kotlin
val credentialManager = CredentialManager.create(context)

// Sign-in
val request = GetCredentialRequest.Builder()
    .addCredentialOption(GetPublicKeyCredentialOption(serverChallengeJson))
    .addCredentialOption(GetPasswordOption())
    .addCredentialOption(GetSignInWithGoogleOption.Builder(serverClientId).build())
    .build()

val response = credentialManager.getCredential(activity, request)
when (val cred = response.credential) {
    is PublicKeyCredential -> sendAssertionToServer(cred.authenticationResponseJson)
    is PasswordCredential  -> signIn(cred.id, cred.password)
    is GoogleIdTokenCredential -> verifyGoogleIdToken(cred.idToken)
}
```

Replaces the older `Smart Lock` and `One Tap` APIs. Passkey enrollment uses `CreatePublicKeyCredentialRequest`.

### Network Security Config

`res/xml/network_security_config.xml`:

```xml
<network-security-config>
    <domain-config>
        <domain includeSubdomains="true">api.example.com</domain>
        <pin-set expiration="2027-01-01">
            <pin digest="SHA-256">7HIpactkIAq2Y49orFOOQKurWxmmSFZhBCoQYcRhJ3Y=</pin>
            <pin digest="SHA-256">YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=</pin>  <!-- backup -->
        </pin-set>
    </domain-config>
    <base-config cleartextTrafficPermitted="false"/>
    <debug-overrides>
        <trust-anchors>
            <certificates src="user"/>  <!-- accept user-installed CAs only in debug -->
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

Wire in manifest: `<application android:networkSecurityConfig="@xml/network_security_config">`.

### Encrypted DataStore

`androidx.security:security-crypto` (`EncryptedSharedPreferences`/`EncryptedFile`) is **deprecated**. Use DataStore with a custom Serializer that encrypts via Tink:

```kotlin
val Context.secureStore: DataStore<Settings> by dataStore(
    fileName = "settings.pb",
    serializer = TinkEncryptedSettingsSerializer(context)
)
```

Provide a `TinkEncryptedSettingsSerializer` that uses an `Aead` from `AndroidKeysetManager` (master key from KeyStore).

## Common Pitfalls

- **Trusting Play Integrity verdict on the client** — always verify the signed token server-side.
- **Using `BIOMETRIC_WEAK` with a `CryptoObject`** — illegal, throws on `authenticate`.
- **No backup pin in NSC pin-set** — when the primary cert rotates and your app caches the config, users get bricked.
- **`cleartextTrafficPermitted="true"`** in production — Play warns and many libraries refuse.
- **Not setting `setAttestationChallenge`** — attestation chain is generated but unverifiable.
- **Continuing to use `EncryptedSharedPreferences`** — deprecated; security maintenance ended.
- **Hardcoding API keys in BuildConfig** — strings are extractable; treat as obfuscation only.
- **Calling `KeyStore.getCertificateChain` on a non-attested key** — returns null or a self-signed cert with no `KeyDescription`.
- **Forgetting to set `targetSdk` to current** — many privacy/security defaults are gated on target SDK.

## Compatibility Notes

- Play Integrity: API 19+ (Standard requests preferred since they're cheaper at scale).
- BiometricPrompt: AndroidX `androidx.biometric:biometric:1.2.0+`; runtime requires API 23 for crypto-bound, but the library shims older APIs.
- Key attestation: API 24+ for full attestation, API 28+ for StrongBox-backed attestation, API 31+ for Remote Key Provisioning (server-side roots).
- Credential Manager: `androidx.credentials:credentials:1.x`; passkey support requires Google Play Services on most non-Pixel devices.
- Network Security Config: API 24+.
- `androidx.security:security-crypto` deprecated; migrate.

## When to Use This Mode

Use this when adding biometric step-up auth, generating a hardware-backed key for token signing, integrating passkeys, hardening TLS for an API, or designing the server-side verification of Play Integrity tokens. Pair with `android-privacy-expert-mode` for the broader user-facing privacy story and `android-15-features-expert-mode` for screen-recording detection and Private Space.

## Sources

- [Overview of the Play Integrity API](https://developer.android.com/google/play/integrity/overview)
- [BiometricPrompt | Reference](https://developer.android.com/reference/androidx/biometric/BiometricPrompt)
- [Android Keystore system](https://developer.android.com/privacy-and-security/keystore)
- [Verifying hardware-backed key pairs with Key Attestation](https://developer.android.com/privacy-and-security/security-key-attestation)
- [Credential Manager](https://developer.android.com/identity/sign-in/credential-manager)
- [Network security configuration](https://developer.android.com/privacy-and-security/security-config)
- [DataStore](https://developer.android.com/topic/libraries/architecture/datastore)
