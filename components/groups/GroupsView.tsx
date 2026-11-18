"use client";

import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useGroupMembership } from "@/lib/accounts/hooks";
import { useStudent } from "@/lib/auth";
import { livesOnCampus } from "@/lib/constants";
import { EMPTY_FILTERS, isIntercampus, matchesFilters, mergeGroups } from "@/lib/groups";
import type { GroupFilterState } from "@/lib/groups";
import { MOCK_GROUPS, MOCK_STUDENTS } from "@/lib/mockData";
import { STORAGE_KEYS, useStoredState } from "@/lib/storage";
import { toast } from "@/lib/toast";
import type { ChatMessage, Group } from "@/lib/types";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupCard } from "./GroupCard";
import { GroupChat } from "./GroupChat";
import { GroupFilters } from "./GroupFilters";

const NO_GROUPS: Group[] = [];
const NO_CHATS: Record<string, ChatMessage[]> = {};

export function GroupsView() {
  const { student } = useStudent();
  const membership = useGroupMembership(student);
  const { joinedIds, memberCount, toggle, join } = membership;
  const [custom, setCustom] = useStoredState<Group[]>(STORAGE_KEYS.customGroups, NO_GROUPS);
  const [chats, setChats] = useStoredState<Record<string, ChatMessage[]>>(STORAGE_KEYS.chats, NO_CHATS);
  const [filters, setFilters] = useState<GroupFilterState>(EMPTY_FILTERS);
  const [creating, setCreating] = useState(false);
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);

  const resident = student !== null && livesOnCampus(student);
  const allGroups = useMemo(() => mergeGroups(custom, MOCK_GROUPS), [custom]);
  const visible = useMemo(() => allGroups.filter((g) => matchesFilters(g, filters)), [allGroups, filters]);
  const between = useMemo(
    () => (resident ? visible.filter((g) => isIntercampus(g) && !joinedIds.has(g.id)) : []),
    [resident, visible, joinedIds],
  );
  const mine = useMemo(() => visible.filter((g) => joinedIds.has(g.id)), [visible, joinedIds]);
  const others = useMemo(
    () => visible.filter((g) => !joinedIds.has(g.id) && !(resident && isIntercampus(g))),
    [visible, joinedIds, resident],
  );
  const chatGroup = chatGroupId ? (allGroups.find((g) => g.id === chatGroupId) ?? null) : null;

  const forYouActive =
    student !== null &&
    filters.mode === "All" &&
    filters.time === "All" &&
    filters.days.length === 0 &&
    (livesOnCampus(student)
      ? filters.kind === "intercampus" && filters.region === "All" && filters.campus === (student.residenceCampus ?? student.campus)
      : filters.kind === "All" && filters.region === student.homeRegion && filters.campus === student.campus);

  const onForYou = useCallback((): void => {
    if (!student) return;
    if (forYouActive) {
      setFilters(EMPTY_FILTERS);
      return;
    }
    if (livesOnCampus(student)) {
      setFilters({ ...EMPTY_FILTERS, kind: "intercampus", campus: student.residenceCampus ?? student.campus });
      return;
    }
    setFilters({ ...EMPTY_FILTERS, region: student.homeRegion, campus: student.campus });
  }, [student, forYouActive]);

  const onToggleJoin = useCallback(
    async (group: Group): Promise<void> => {
      const nowJoined = await toggle(group);
      if (nowJoined) {
        toast({ title: "Joined group", message: `You can now chat with ${group.name}.`, tone: "success" });
      } else {
        if (chatGroupId === group.id) setChatGroupId(null);
        toast({ title: "Left group", message: group.name, tone: "info" });
      }
    },
    [toggle, chatGroupId],
  );

  const onCreate = useCallback(
    (group: Group): void => {
      setCustom((prev) => [group, ...prev]);
      void join(group.id);
      setCreating(false);
      setFilters(EMPTY_FILTERS);
      toast({ title: "Group created", message: `${group.name} is live and you are in it.`, tone: "success" });
    },
    [setCustom, join],
  );

  const onSaveChat = useCallback(
    (groupId: string, messages: ChatMessage[]): void => {
      setChats((prev) => ({ ...prev, [groupId]: messages }));
    },
    [setChats],
  );

  const renderCard = (g: Group): ReactNode => (
    <GroupCard key={g.id} group={g} joined={joinedIds.has(g.id)} memberCount={memberCount(g)} onToggleJoin={(grp) => void onToggleJoin(grp)} onOpenChat={(grp) => setChatGroupId(grp.id)} />
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
          {between.length > 0 ? (
            <section aria-labelledby="between-campuses">
              <h2 id="between-campuses" className="section-title mb-1">Between campuses <span className="text-base text-ink-400">({between.length})</span></h2>
              <p className="mb-3 text-sm text-ink-600">Ram Van rides between Rose Hill and Lincoln Center, about every 30 minutes.</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{between.map(renderCard)}</div>
            </section>
          ) : null}
          {mine.length > 0 ? (
            <section aria-labelledby="your-groups">
              <h2 id="your-groups" className="section-title mb-3">Your groups <span className="text-base text-ink-400">({mine.length})</span></h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{mine.map(renderCard)}</div>
            </section>
          ) : null}
          {others.length > 0 ? (
            <section aria-labelledby="all-groups">
              <h2 id="all-groups" className="section-title mb-3">{mine.length > 0 || between.length > 0 ? "More groups" : "All groups"} <span className="text-base text-ink-400">({others.length})</span></h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{others.map(renderCard)}</div>
            </section>
          ) : null}
        </div>
      )}

      {creating && student ? <CreateGroupDialog student={student} onCreate={onCreate} onClose={() => setCreating(false)} /> : null}
      {chatGroup && student && joinedIds.has(chatGroup.id) ? (
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
