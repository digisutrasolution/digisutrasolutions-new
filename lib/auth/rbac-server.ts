import "server-only";
import { db } from "@/lib/db";
import {
  ALL_PERMISSIONS,
  EDITABLE_ROLES,
  RBAC_MATRIX_VERSION,
  setRbacOverrides,
  type Permission,
  type StoredRbac,
} from "@/lib/auth/rbac";

const SETTING_KEY = "rbac";
// Re-read the override matrix from the DB at most this often, so a matrix edit
// propagates within a few seconds without a DB hit on every request.
const TTL_MS = 15_000;

let loadedAt = 0;
let loading: Promise<void> | null = null;

/** Either shape: the current { version, catalog, roles } or the legacy bare
    role map. setRbacOverrides tells them apart. */
type Stored = StoredRbac | Partial<Record<string, string[]>>;

async function readMatrix(): Promise<Stored | null> {
  const row = await db.siteSetting.findUnique({ where: { key: SETTING_KEY } });
  if (!row) return null;
  return row.value as Stored;
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

/** Persist a new matrix for the editable roles and refresh the cache now.
    The permission catalog is stored alongside it so a permission added in a
    later release can tell "the admin unticked this" from "this did not exist
    when they saved" — see the note in lib/auth/rbac.ts. */
export async function saveRbacMatrix(
  matrix: Record<(typeof EDITABLE_ROLES)[number], Permission[]>,
): Promise<void> {
  const value: StoredRbac = {
    version: RBAC_MATRIX_VERSION,
    catalog: [...ALL_PERMISSIONS],
    roles: matrix,
  };
  await db.siteSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: value as object },
    update: { value: value as object },
  });
  setRbacOverrides(value);
  loadedAt = Date.now();
}
