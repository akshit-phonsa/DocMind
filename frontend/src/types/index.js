// JSDoc typedefs for the backend DTOs (the project is plain JS, so these are editor hints only).

/** @typedef {{ id: string|number, username: string, email: string, role: 'USER'|'ADMIN'|string }} UserDto */
/** @typedef {{ accessToken: string, user: UserDto }} LoginResponse */

/**
 * @typedef {{
 *   documentId: string, fileName: string, chunkIndex: number, pageNumber: number|null,
 *   snippet: string, similarityScore: number, metadata: object
 * }} CitationDto
 */

/** @typedef {{ id: string, title: string, createdAt: string, updatedAt: string }} ConversationDto */

/**
 * Messages may carry optional extras (citations / responseTimeMs) so a reloaded
 * transcript renders exactly like the live one.
 * @typedef {{
 *   id: string, messageType: 'USER'|'ASSISTANT'|'SYSTEM', content: string, createdAt: string,
 *   citations?: CitationDto[], responseTimeMs?: number, error?: boolean
 * }} MessageDto
 */

export {}
