"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS, useStoredState } from "../storage";
import { toast } from "../toast";
import type { Group, Student } from "../types";
import { accountErrorMessage, accounts } from "./index";
import { isDemoStudent } from "./shared";
import type { GroupMember } from "./types";

interface ClassmateCardsState {
  /** null while the first snapshot is loading. Deduped by id. */
  cards: Student[] | null;
  error: boolean;
}

/** Live classmate cards of every real account (empty and idle for the demo profile). */
export function useClassmateCards(enabled: boolean): ClassmateCardsState {
  const [state, setState] = useState<ClassmateCardsState>({ cards: null, error: false });
  useEffect(() => {
    if (!enabled) return;
    return accounts.subscribeClassmates(
      (cards) => setState({ cards, error: false }),
      () => setState({ cards: [], error: true }),
    );
  }, [enabled]);
  return enabled ? state : { cards: [], error: false };
}

const NO_IDS: string[] = [];

export interface GroupMembership {
  joinedIds: Set<string>;
  /** Seeded members plus every real member, each account counted once. */
  memberCount: (group: Group) => number;
  /** Joins or leaves. Returns true when the student is now a member. */
  toggle: (group: Group) => Promise<boolean>;
  /** Adds the student to a group (used right after creating one). */
  join: (groupId: string) => Promise<void>;
  /** True when memberships are shared through the backend (false for the demo profile). */
  shared: boolean;
}

/**
 * Group membership for the signed-in student. Real accounts store one record per (group, account)
 * in the backend, so other students see the same counts. The demo profile, or a backend that
 * refuses access, falls back to this browser.
 */
export function useGroupMembership(student: Student | null): GroupMembership {
  const real = student !== null && !isDemoStudent(student);
  const [members, setMembers] = useState<GroupMember[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [localJoined, setLocalJoined] = useStoredState<string[]>(STORAGE_KEYS.joinedGroups, NO_IDS);

  useEffect(() => {
    if (!real) return;
    return accounts.subscribeGroupMembers(
      (next) => {
        setMembers(next);
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, [real]);

  const shared = real && !failed;
  const uid = student?.id ?? "";

  const counts = useMemo(() => {
    const byGroup = new Map<string, Set<string>>();
    (members ?? []).forEach((m) => byGroup.set(m.groupId, (byGroup.get(m.groupId) ?? new Set()).add(m.uid)));
    return byGroup;
  }, [members]);

  const joinedIds = useMemo(() => {
    if (!shared) return new Set(localJoined);
    return new Set((members ?? []).filter((m) => m.uid === uid).map((m) => m.groupId));
  }, [shared, members, localJoined, uid]);

  const memberCount = useCallback(
    (group: Group): number => {
      const seeded = group.isCustom ? 0 : group.memberCount;
      if (!shared) return seeded + (joinedIds.has(group.id) ? 1 : 0);
      return seeded + (counts.get(group.id)?.size ?? 0);
    },
    [shared, counts, joinedIds],
  );

  const join = useCallback(
    async (groupId: string): Promise<void> => {
      if (!shared) {
        setLocalJoined((prev) => (prev.includes(groupId) ? prev : [...prev, groupId]));
        return;
      }
      await accounts.joinGroup(groupId, uid);
    },
    [shared, uid, setLocalJoined],
  );

  const toggle = useCallback(
    async (group: Group): Promise<boolean> => {
      const wasJoined = joinedIds.has(group.id);
      try {
        if (!shared) {
          setLocalJoined((prev) => (wasJoined ? prev.filter((id) => id !== group.id) : prev.includes(group.id) ? prev : [...prev, group.id]));
        } else if (wasJoined) {
          await accounts.leaveGroup(group.id, uid);
        } else {
          await accounts.joinGroup(group.id, uid);
        }
        return !wasJoined;
      } catch (error) {
        toast({ title: "Could not update the group", message: accountErrorMessage(error), tone: "warning" });
        return wasJoined;
      }
    },
    [joinedIds, shared, uid, setLocalJoined],
  );

  return { joinedIds, memberCount, toggle, join, shared };
}
