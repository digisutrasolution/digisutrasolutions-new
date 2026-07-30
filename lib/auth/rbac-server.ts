import "server-only";
import { db } from "@/lib/db";
import { EDITABLE_ROLES, setRbacOverrides, type Permission } from "@/lib/auth/rbac";

const SETTING_KEY = "rbac";
// Re-read the override matrix from the DB at most this often, so a matrix edit
// propagates within a few seconds without a DB hit on every request.
const TTL_MS = 15_000;

let loadedAt = 0;
let loading: Promise<void> | null = null;

type Matrix = Partial<Record<string, string[]>>;

async function readMatrix(): Promise<Matrix | null> {
  const row = await db.siteSetting.findUnique({ where: { key: SETTING_KEY } });
  if (!row) return null;
  return row.value as Matrix;
}

/** Make sure the in-memory override matrix is fresh (called before permission
    checks resolve, from getCurrentUser). Cheap and safe to call every request. */
export async function ensureRbacLoaded(force = false): Promise<void> {
  if (!force && Date.now() - loadedAt < TTL_MS) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      const matrix = await readMatrix();
      setRbacOverrides(matrix);
      loadedAt = Date.now();
    } catch (err) {
      console.error("ensureRbacLoaded failed:", err);
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Persist a new matrix for the editable roles and refresh the cache now. */
export async function saveRbacMatrix(
  matrix: Record<(typeof EDITABLE_ROLES)[number], Permission[]>,
): Promise<void> {
  await db.siteSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: matrix },
    update: { value: matrix },
  });
  setRbacOverrides(matrix);
  loadedAt = Date.now();
}
