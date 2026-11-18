"use client";

import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStudent } from "@/lib/auth";
import { EMPTY_FILTERS, matchesFilters } from "@/lib/groups";
import type { GroupFilterState } from "@/lib/groups";
import { MOCK_GROUPS, MOCK_STUDENTS } from "@/lib/mockData";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";
import { toast } from "@/lib/toast";
import type { ChatMessage, Group } from "@/lib/types";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupCard } from "./GroupCard";
import { GroupChat } from "./GroupChat";
import { GroupFilters } from "./GroupFilters";

const NO_IDS: string[] = [];
const NO_GROUPS: Group[] = [];
const NO_CHATS: Record<string, ChatMessage[]> = {};

export function GroupsView() {
  const { student } = useStudent();
  const [joined, setJoined] = useStoredState<string[]>(STORAGE_KEYS.joinedGroups, NO_IDS);
  const [custom, setCustom] = useStoredState<Group[]>(STORAGE_KEYS.customGroups, NO_GROUPS);
  const [chats, setChats] = useStoredState<Record<string, ChatMessage[]>>(STORAGE_KEYS.chats, NO_CHATS);
  const [filters, setFilters] = useState<GroupFilterState>(EMPTY_FILTERS);
  const [creating, setCreating] = useState(false);
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);

  const allGroups = useMemo(() => [...custom, ...MOCK_GROUPS], [custom]);
  const joinedSet = useMemo(() => new Set(joined), [joined]);
  const visible = useMemo(() => allGroups.filter((g) => matchesFilters(g, filters)), [allGroups, filters]);
  const mine = useMemo(() => visible.filter((g) => joinedSet.has(g.id)), [visible, joinedSet]);
  const others = useMemo(() => visible.filter((g) => !joinedSet.has(g.id)), [visible, joinedSet]);
  const chatGroup = chatGroupId ? (allGroups.find((g) => g.id === chatGroupId) ?? null) : null;

  const forYouActive =
    student !== null &&
    filters.region === student.homeRegion &&
    filters.campus === student.campus &&
    filters.mode === "All" &&
    filters.time === "All" &&
    filters.days.length === 0;

  const onForYou = useCallback((): void => {
    if (!student) return;
    setFilters(forYouActive ? EMPTY_FILTERS : { ...EMPTY_FILTERS, region: student.homeRegion, campus: student.campus });
  }, [student, forYouActive]);

  const onToggleJoin = useCallback(
    (group: Group): void => {
      if (joinedSet.has(group.id)) {
        setJoined((prev) => prev.filter((id) => id !== group.id));
        if (chatGroupId === group.id) setChatGroupId(null);
        toast({ title: "Left group", message: group.name, tone: "info" });
      } else {
        setJoined((prev) => (prev.includes(group.id) ? prev : [...prev, group.id]));
        toast({ title: "Joined group", message: `You can now chat with ${group.name}.`, tone: "success" });
      }
    },
    [joinedSet, setJoined, chatGroupId],
  );

  const onCreate = useCallback(
    (group: Group): void => {
      setCustom((prev) => [group, ...prev]);
      setJoined((prev) => [...prev, group.id]);
      setCreating(false);
      setFilters(EMPTY_FILTERS);
      toast({ title: "Group created", message: `${group.name} is live and you are in it.`, tone: "success" });
    },
    [setCustom, setJoined],
  );

  const onSaveChat = useCallback(
    (groupId: string, messages: ChatMessage[]): void => {
      setChats((prev) => ({ ...prev, [groupId]: messages }));
    },
    [setChats],
  );

  const renderCard = (g: Group): ReactNode => (
    <GroupCard key={g.id} group={g} joined={joinedSet.has(g.id)} onToggleJoin={onToggleJoin} onOpenChat={(grp) => setChatGroupId(grp.id)} />
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Groups"
        title="Commute together"
        description="Find students who travel your route and time. Join a group to coordinate in chat."
        actions={
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Create group
          </button>
        }
      />

      <GroupFilters
        filters={filters}
        resultCount={visible.length}
        forYouActive={forYouActive}
        onChange={setFilters}
        onForYou={onForYou}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      {visible.length === 0 ? (
        <EmptyState
          title={allGroups.length === 0 ? "No groups yet" : "No groups match those filters"}
          message={
            allGroups.length === 0
              ? "Be the first to start a commute group for your route."
              : "Try removing a filter, or start a group for your own route."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {allGroups.length > 0 ? (
                <button type="button" className="btn-secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear filters
                </button>
              ) : null}
              <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
                Create group
              </button>
            </div>
          }
        />
      ) : (
        <div className="space-y-8">
          {mine.length > 0 ? (
            <section aria-labelledby="your-groups">
              <h2 id="your-groups" className="section-title mb-3">Your groups <span className="text-base text-ink-400">({mine.length})</span></h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{mine.map(renderCard)}</div>
            </section>
          ) : null}
          {others.length > 0 ? (
            <section aria-labelledby="all-groups">
              <h2 id="all-groups" className="section-title mb-3">{mine.length > 0 ? "More groups" : "All groups"} <span className="text-base text-ink-400">({others.length})</span></h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{others.map(renderCard)}</div>
            </section>
          ) : null}
        </div>
      )}

      {creating && student ? <CreateGroupDialog student={student} onCreate={onCreate} onClose={() => setCreating(false)} /> : null}
      {chatGroup && student && joinedSet.has(chatGroup.id) ? (
        <GroupChat
          key={chatGroup.id}
          group={chatGroup}
          student={student}
          people={MOCK_STUDENTS}
          stored={chats[chatGroup.id]}
          onSave={onSaveChat}
          onClose={() => setChatGroupId(null)}
        />
      ) : null}
    </div>
  );
}
