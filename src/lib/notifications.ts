import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDocs,
  where,
} from "firebase/firestore";
import { getFirebase } from "./firebase";

const COLLECTION = "notifications";

export interface AppNotification {
  id: string;
  issueId: string;
  title: string;
  category: string;
  location: string;
  urgency: string;
  reporterId: string | null;
  reporterEmail: string;
  reporterName: string | null;
  read: boolean;
  createdAt: Date;
}

export interface NewNotification {
  issueId: string;
  title: string;
  category: string;
  location: string;
  urgency: string;
  reporterId: string | null;
  reporterEmail: string;
  reporterName: string | null;
}

export async function createIssueNotification(data: NewNotification) {
  const { db } = getFirebase();
  if (!db) return;
  await addDoc(collection(db, COLLECTION), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeNotifications(
  cb: (items: AppNotification[]) => void,
  onError?: (e: Error) => void,
) {
  const { db } = getFirebase();
  if (!db) return () => {};
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const items: AppNotification[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const created = data.createdAt;
        const createdAt =
          created instanceof Timestamp ? created.toDate() : new Date();
        return {
          id: d.id,
          issueId: (data.issueId as string) ?? "",
          title: (data.title as string) ?? "",
          category: (data.category as string) ?? "",
          location: (data.location as string) ?? "",
          urgency: (data.urgency as string) ?? "",
          reporterId: (data.reporterId as string | null) ?? null,
          reporterEmail: (data.reporterEmail as string) ?? "",
          reporterName: (data.reporterName as string | null) ?? null,
          read: Boolean(data.read),
          createdAt,
        };
      });
      cb(items);
    },
    (err) => onError?.(err),
  );
}

export async function markNotificationRead(id: string, read = true) {
  const { db } = getFirebase();
  if (!db) return;
  await updateDoc(doc(db, COLLECTION, id), { read });
}

export async function deleteNotification(id: string) {
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function markAllNotificationsRead() {
  const { db } = getFirebase();
  if (!db) return;
  const q = query(collection(db, COLLECTION), where("read", "==", false));
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}
