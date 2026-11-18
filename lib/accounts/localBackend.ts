"use client";

import { normalizeEmail } from "../constants";
import { STORAGE_KEYS, makeId, readStored, writeStored } from "../storage";
import type { Student } from "../types";
import { classmateCardOf, dedupeMembers, requireFordhamEmail, requireStrongPassword } from "./shared";
import { AccountError, type AccountBackend, type GroupMember, type SignedInAccount } from "./types";

/**
 * Local mock backend for demos without a server. Same rules as the real one: a single registry
 * keyed by normalized email, unique accounts, and passwords stored only as salted PBKDF2-SHA-256
 * hashes (Web Crypto). Everything lives in this browser's localStorage.
 */
interface LocalAccount {
  id: string;
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
  profile: Student | null;
  resetCode?: string;
  resetExpiresAt?: number;
}

type Registry = Record<string, LocalAccount>;

const EMPTY_REGISTRY: Registry = {};
const NO_MEMBERS: GroupMember[] = [];
const NO_SESSION: string | null = null;
const HASH_ITERATIONS = 100_000;
const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const CHANGE_EVENT = "ramhub:storage";

const toHex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

function randomHex(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (!crypto?.subtle) throw new AccountError("unknown", "Secure password hashing needs HTTPS or localhost.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: HASH_ITERATIONS },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

/** Constant-time comparison so a wrong password takes as long as a right one. */
function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const registry = (): Registry => readStored<Registry>(STORAGE_KEYS.accounts, EMPTY_REGISTRY);
const saveRegistry = (next: Registry): void => writeStored(STORAGE_KEYS.accounts, next);
const findById = (uid: string): LocalAccount | undefined => Object.values(registry()).find((a) => a.id === uid);

function updateAccount(email: string, patch: Partial<LocalAccount>): void {
  const current = registry();
  const account = current[email];
  if (!account) throw new AccountError("account-not-found");
  saveRegistry({ ...current, [email]: { ...account, ...patch } });
}

function startSession(account: LocalAccount): SignedInAccount {
  writeStored<string | null>(STORAGE_KEYS.localSession, account.id);
  return { uid: account.id, email: account.email, displayName: account.name || null };
}

function watchStorage(emit: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, emit);
  window.addEventListener("storage", emit);
  emit();
  return () => {
    window.removeEventListener(CHANGE_EVENT, emit);
    window.removeEventListener("storage", emit);
  };
}

/** Wrong email and wrong password look identical, and take the same time. */
async function failCredentials(password: string): Promise<never> {
  await hashPassword(password, "timing-equalizer");
  throw new AccountError("invalid-credentials");
}

export const localBackend: AccountBackend = {
  kind: "local",
  supportsGoogle: false,

  async signUp(rawEmail, password, name) {
    const email = requireFordhamEmail(rawEmail);
    requireStrongPassword(password);
    if (registry()[email]) throw new AccountError("email-exists");
    const salt = randomHex(16);
    const account: LocalAccount = {
      id: makeId("local"),
      email,
      name: name.trim(),
      salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
      profile: null,
    };
    // Re-read after the async hash so two quick submits can never both register.
    if (registry()[email]) throw new AccountError("email-exists");
    saveRegistry({ ...registry(), [email]: account });
    return startSession(account);
  },

  async signIn(rawEmail, password) {
    const account = registry()[normalizeEmail(rawEmail)];
    if (!account) return failCredentials(password);
    const hash = await hashPassword(password, account.salt);
    if (!sameHash(hash, account.passwordHash)) throw new AccountError("invalid-credentials");
    return startSession(account);
  },

  async signInWithGoogle() {
    throw new AccountError("operation-not-allowed", "Google sign-in needs the real backend.");
  },

  currentUid: () => readStored<string | null>(STORAGE_KEYS.localSession, NO_SESSION),

  onSessionChange(listener) {
    if (typeof window === "undefined") return () => {};
    let last: string | null | undefined;
    return watchStorage(() => {
      const uid = readStored<string | null>(STORAGE_KEYS.localSession, NO_SESSION);
      if (uid !== last) {
        last = uid;
        listener(uid);
      }
    });
  },

  async signOut() {
    writeStored<string | null>(STORAGE_KEYS.localSession, null);
  },

  async requestPasswordReset(rawEmail) {
    const email = normalizeEmail(rawEmail);
    if (!registry()[email]) throw new AccountError("account-not-found");
    const code = randomHex(16);
    updateAccount(email, { resetCode: code, resetExpiresAt: Date.now() + RESET_CODE_TTL_MS });
    return { kind: "local-code", code };
  },

  async verifyResetCode(code) {
    const account = Object.values(registry()).find((a) => a.resetCode === code);
    if (!account || !account.resetExpiresAt || account.resetExpiresAt < Date.now()) {
      throw new AccountError("invalid-reset-code");
    }
    return account.email;
  },

  async confirmPasswordReset(code, newPassword) {
    requireStrongPassword(newPassword);
    const email = await localBackend.verifyResetCode(code);
    const salt = randomHex(16);
    const passwordHash = await hashPassword(newPassword, salt);
    updateAccount(email, { salt, passwordHash, resetCode: undefined, resetExpiresAt: undefined });
  },

  async loadProfile(uid) {
    return findById(uid)?.profile ?? null;
  },

  async saveProfile(student) {
    const account = findById(student.id);
    if (!account) throw new AccountError("account-not-found");
    updateAccount(account.email, { profile: { ...student, email: account.email }, name: student.name });
  },

  subscribeClassmates(listener) {
    if (typeof window === "undefined") return () => {};
    let lastRaw = "";
    return watchStorage(() => {
      const cards = Object.values(registry())
        .filter((a) => a.profile)
        .map((a) => classmateCardOf(a.profile as Student));
      const raw = JSON.stringify(cards);
      if (raw === lastRaw) return;
      lastRaw = raw;
      listener(cards);
    });
  },

  subscribeGroupMembers(listener) {
    if (typeof window === "undefined") return () => {};
    let last: GroupMember[] | null = null;
    return watchStorage(() => {
      const members = readStored<GroupMember[]>(STORAGE_KEYS.groupMembers, NO_MEMBERS);
      if (members === last) return;
      last = members;
      listener(dedupeMembers(members));
    });
  },

  async joinGroup(groupId, uid) {
    const members = readStored<GroupMember[]>(STORAGE_KEYS.groupMembers, NO_MEMBERS);
    writeStored(STORAGE_KEYS.groupMembers, dedupeMembers([...members, { groupId, uid }]));
  },

  async leaveGroup(groupId, uid) {
    const members = readStored<GroupMember[]>(STORAGE_KEYS.groupMembers, NO_MEMBERS);
    writeStored(
      STORAGE_KEYS.groupMembers,
      members.filter((m) => !(m.groupId === groupId && m.uid === uid)),
    );
  },
};
