<div align="center">

# 🔒 SECURITY & PRIVACY AUDIT PROTOCOL

**[ CLASSIFICATION: CRITICAL INFRASTRUCTURE ]**

</div>

---

ZeroMomentum AI operates at the intersection of local database management, complex AI routing, and live webcam visual telemetry. Because we process highly sensitive productivity and biometric markers, **Security is not a feature; it is an architectural requirement.**

## 🟢 1. Active Support Matrix

We aggressively maintain the `main` branch. Older, depreciated forks are not monitored by our security engine.

| Branch / Tag | Security Updates Active | Patch Response Time |
| :--- | :---: | :--- |
| **`main` (Latest)** | :white_check_mark: YES | < 48 Hours |
| **`< v1.0` (Legacy)**| :x: NO | Unsupported |

---

## 🚨 2. Vulnerability Reporting Protocol

> [!WARNING]
> **DO NOT CREATE A PUBLIC GITHUB ISSUE FOR A SECURITY VULNERABILITY.**

If you discover a flaw in the authentication middleware, database routing, or telemetry tracking that could expose user data, you must follow this protocol:

1. Draft a detailed technical report of the exploit.
2. Include the exact stack trace, the affected file paths, and a Proof of Concept (PoC) if possible.
3. Transmit the encrypted/secure report directly to the Core Architect at: **[myselfdeb11@gmail.com]**.

You will receive an acknowledgment within 24 hours. The vulnerability will be patched, and you will be credited in the subsequent release notes.

---

## 👁️ 3. The "Zero-Cloud" Telemetry Promise

This platform utilizes `TensorFlow.js` and the `BlazeFace` model to execute machine vision on the user's webcam feed. This is a highly sensitive operation.

**Our Absolute Security Guarantee:**
- The video feed is captured via the `navigator.mediaDevices.getUserMedia` API strictly inside the client's browser.
- The neural network processes the spatial coordinate geometry in local RAM/WebGL.
- The raw video frames are **instantaneously destroyed**.
- Zero images, video chunks, or raw biometric mappings are ever transmitted via HTTP/WebSocket to the Node.js backend or any external cloud provider. 

Any Pull Request that attempts to modify this pipeline to export video data will be **immediately and permanently rejected**, and the contributor will be banned from the repository.

---

## 🔑 4. Environment Variable Security

When deploying this platform to production, the Node.js backend relies on secure environment variables injected directly into **Google Cloud Run** to establish connection pools via Prisma ORM to **Google Cloud SQL**.

- **Never commit your `.env` file.** (It is already included in the `.gitignore` and `.gcloudignore`, do not override this).
- Use robust, cryptographically secure passwords for your Google Cloud SQL PostgreSQL instance and restrict `0.0.0.0/0` access if possible.
- API keys (Gemini, Groq) must be injected strictly through the Google Cloud Console's Environment Variables panel. Do not hardcode them into the Docker images.

<div align="center">
  <i>We engineer momentum. We do not compromise privacy.</i>
</div>
