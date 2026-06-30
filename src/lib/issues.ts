import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import { createIssueNotification } from "./notifications";

export type IssueCategory =
  | "Garbage"
  | "Road Damage"
  | "Water Leakage"
  | "Street Light"
  | "Public Safety"
  | "Other";

export type IssueUrgency = "Low" | "Medium" | "High";

// Extended status pipeline. "Solved" kept as legacy alias of "Resolved".
export type IssueStatus =
  | "Pending"
  | "Verified"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Closed"
  | "Solved";

export const ISSUE_STATUSES: IssueStatus[] = [
  "Pending",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
];

export function isResolvedStatus(s: string | undefined | null): boolean {
  const v = (s ?? "").toLowerCase();
  return v === "resolved" || v === "solved" || v === "closed";
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  urgency: IssueUrgency;
  status: IssueStatus;
  createdAt: Date;
  userEmail: string;
  userName?: string;
  userId?: string | null;
  imageURL?: string | null;
}

export interface NewIssue {
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  urgency: IssueUrgency;
  userEmail: string;
  userName?: string;
  userId?: string | null;
  imageURL?: string | null;
}

const COLLECTION = "issues";

export async function createIssue(data: NewIssue) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore unavailable");
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    userId: data.userId ?? null,
    imageURL: data.imageURL ?? null,
    status: "Pending" as IssueStatus,
    createdAt: serverTimestamp(),
  });
  // Fire-and-forget notification for admins
  try {
    await createIssueNotification({
      issueId: docRef.id,
      title: data.title,
      category: data.category,
      location: data.location,
      urgency: data.urgency,
      reporterId: data.userId ?? null,
      reporterEmail: data.userEmail,
      reporterName: data.userName ?? null,
    });
  } catch (e) {
    console.warn("Notification creation failed", e);
  }
  return docRef.id;
}

export async function updateIssueStatus(id: string, status: IssueStatus) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore unavailable");
  await updateDoc(doc(db, COLLECTION, id), { status });
}

export async function updateIssue(
  id: string,
  patch: Partial<Pick<Issue, "title" | "description" | "category" | "location" | "urgency">>,
) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore unavailable");
  await updateDoc(doc(db, COLLECTION, id), patch);
}

export async function deleteIssue(id: string) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore unavailable");
  await deleteDoc(doc(db, COLLECTION, id));
}

function rowToIssue(d: { id: string; data: () => Record<string, unknown> }): Issue {
  const data = d.data();
  const created = data.createdAt;
  const createdAt =
    created instanceof Timestamp
      ? created.toDate()
      : created instanceof Date
        ? created
        : new Date();
  return {
    id: d.id,
    title: (data.title as string) ?? "",
    description: (data.description as string) ?? "",
    category: (data.category as IssueCategory) ?? "Other",
    location: (data.location as string) ?? "",
    urgency: (data.urgency as IssueUrgency) ?? "Low",
    status: (data.status as IssueStatus) ?? "Pending",
    userEmail: (data.userEmail as string) ?? "",
    userName: data.userName as string | undefined,
    userId: (data.userId as string | null | undefined) ?? null,
    imageURL: (data.imageURL as string | null | undefined) ?? null,
    createdAt,
  };
}

export async function listIssues(): Promise<Issue[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const items = snap.docs.map(rowToIssue);
  if (items.length === 0) {
    await seedDemoIssues();
    return listIssuesRaw();
  }
  return items;
}

async function listIssuesRaw(): Promise<Issue[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(rowToIssue);
}

async function seedDemoIssues() {
  const { db } = getFirebase();
  if (!db) return;
  const demos: Omit<Issue, "id" | "createdAt">[] = [
    {
      title: "Overflowing garbage near Park Lane",
      description: "Bins on Park Lane haven't been collected in 4 days.",
      category: "Garbage",
      location: "Park Lane, Sector 12",
      urgency: "High",
      status: "Pending",
      userEmail: "aarav@neighbor.net",
      userName: "Aarav Sharma",
    },
    {
      title: "Pothole on Main Road",
      description: "Large pothole causing traffic slowdowns and bike accidents.",
      category: "Road Damage",
      location: "Main Rd & 5th Ave",
      urgency: "Medium",
      status: "In Progress",
      userEmail: "meera@neighbor.net",
      userName: "Meera Iyer",
    },
    {
      title: "Streetlight out on Elm Street",
      description: "Two consecutive lights out — pitch dark after 8pm.",
      category: "Street Light",
      location: "Elm Street",
      urgency: "Medium",
      status: "Resolved",
      userEmail: "diego@neighbor.net",
      userName: "Diego Alvarez",
    },
    {
      title: "Water leakage from main pipe",
      description: "Continuous water leak near the community garden.",
      category: "Water Leakage",
      location: "Community Garden",
      urgency: "High",
      status: "Verified",
      userEmail: "sara@neighbor.net",
      userName: "Sara Khan",
    },
    {
      title: "Unsafe construction site",
      description: "Construction site left open without barricades.",
      category: "Public Safety",
      location: "Hill View Apartments",
      urgency: "High",
      status: "Assigned",
      userEmail: "aarav@neighbor.net",
      userName: "Aarav Sharma",
    },
    {
      title: "Faded zebra crossing near school",
      description: "Zebra crossing needs repainting urgently.",
      category: "Road Damage",
      location: "St. Mary's School",
      urgency: "Low",
      status: "Closed",
      userEmail: "meera@neighbor.net",
      userName: "Meera Iyer",
    },
  ];

  const batch = writeBatch(db);
  demos.forEach((item, i) => {
    const ref = doc(collection(db, COLLECTION));
    const created = new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 12);
    batch.set(ref, { ...item, userId: null, createdAt: Timestamp.fromDate(created) });
  });
  await batch.commit();
}

export interface LeaderboardEntry {
  email: string;
  name: string;
  reported: number;
  solved: number;
  points: number;
}

export function buildLeaderboard(issues: Issue[]): LeaderboardEntry[] {
  const map = new Map<string, LeaderboardEntry>();
  for (const i of issues) {
    const entry = map.get(i.userEmail) ?? {
      email: i.userEmail,
      name: i.userName ?? i.userEmail.split("@")[0],
      reported: 0,
      solved: 0,
      points: 0,
    };
    entry.reported += 1;
    if (isResolvedStatus(i.status)) entry.solved += 1;
    entry.points = entry.reported * 10 + entry.solved * 25;
    map.set(i.userEmail, entry);
  }
  return [...map.values()].sort((a, b) => b.points - a.points);
}
