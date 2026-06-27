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
} from "firebase/firestore";
import { getFirebase } from "./firebase";

export type IssueCategory =
  | "Garbage"
  | "Road Damage"
  | "Water Leakage"
  | "Street Light"
  | "Public Safety"
  | "Other";

export type IssueUrgency = "Low" | "Medium" | "High";
export type IssueStatus = "Pending" | "In Progress" | "Solved";

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
}

export interface NewIssue {
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  urgency: IssueUrgency;
  userEmail: string;
  userName?: string;
}

const COLLECTION = "issues";

export async function createIssue(data: NewIssue) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore unavailable");
  await addDoc(collection(db, COLLECTION), {
    ...data,
    status: "Pending" as IssueStatus,
    createdAt: serverTimestamp(),
  });
}

export async function listIssues(): Promise<Issue[]> {
  const { db } = getFirebase();
  if (!db) return [];
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const items: Issue[] = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
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
      createdAt,
    };
  });

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
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const created = data.createdAt;
    const createdAt =
      created instanceof Timestamp ? created.toDate() : new Date();
    return {
      id: d.id,
      title: data.title as string,
      description: data.description as string,
      category: data.category as IssueCategory,
      location: data.location as string,
      urgency: data.urgency as IssueUrgency,
      status: data.status as IssueStatus,
      userEmail: data.userEmail as string,
      userName: data.userName as string | undefined,
      createdAt,
    };
  });
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
      status: "Solved",
      userEmail: "diego@neighbor.net",
      userName: "Diego Alvarez",
    },
    {
      title: "Water leakage from main pipe",
      description: "Continuous water leak near the community garden.",
      category: "Water Leakage",
      location: "Community Garden",
      urgency: "High",
      status: "Pending",
      userEmail: "sara@neighbor.net",
      userName: "Sara Khan",
    },
    {
      title: "Unsafe construction site",
      description: "Construction site left open without barricades.",
      category: "Public Safety",
      location: "Hill View Apartments",
      urgency: "High",
      status: "In Progress",
      userEmail: "aarav@neighbor.net",
      userName: "Aarav Sharma",
    },
    {
      title: "Faded zebra crossing near school",
      description: "Zebra crossing needs repainting urgently.",
      category: "Road Damage",
      location: "St. Mary's School",
      urgency: "Low",
      status: "Solved",
      userEmail: "meera@neighbor.net",
      userName: "Meera Iyer",
    },
  ];

  const batch = writeBatch(db);
  demos.forEach((item, i) => {
    const ref = doc(collection(db, COLLECTION));
    const created = new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 12);
    batch.set(ref, { ...item, createdAt: Timestamp.fromDate(created) });
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
    if (i.status === "Solved") entry.solved += 1;
    entry.points = entry.reported * 10 + entry.solved * 25;
    map.set(i.userEmail, entry);
  }
  return [...map.values()].sort((a, b) => b.points - a.points);
}
