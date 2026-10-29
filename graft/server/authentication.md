# server/authentication.js

- checkPassword · function · L35-L37 — async function checkPassword (username, password)
- checkToken · function · L46-L54 — function checkToken (username, token, checkEmailVerification = false)
- generateToken · function · L62-L64 — function generateToken (username, verifiedEmail = false)
- resolveLoginIdentifier · function · L72-L83 — async function resolveLoginIdentifier (identifier)
- saltAndHashPassword · function · L90-L96 — function saltAndHashPassword (password)
- sendResetPasswordEmail · function · L98-L123 — async function sendResetPasswordEmail (username)
- sendVerificationEmail · function · L125-L150 — async function sendVerificationEmail (username)
- updatePassword · function · L152-L154 — function updatePassword (username, newPassword)
- validateEmail · function · L161-L163 — function validateEmail (email)
- validateUsername · function · L170-L191 — function validateUsername (username)
- verifyEmailLink · function · L193-L224 — function verifyEmailLink (userId, token)
- verifyResetPasswordLink · function · L226-L254 — function verifyResetPasswordLink (userId, token)
