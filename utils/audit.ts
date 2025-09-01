// utils/audit.ts
const HIDDEN = "[hidden]";

export function sanitizePackage(p: any) {
  if (!p) return p;
  // Package model ছোট—সেন্সিটিভ কিছু নেই। শুধু দরকারি ফিল্ড রাখি।
  const { id, name, description, createdAt, updatedAt } = p;
  return { id, name, description, createdAt, updatedAt };
}

export function diffChanges(before: any, after: any, ignore: string[] = []) {
  const changed: Record<string, { from: any; to: any }> = {};
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  keys.forEach((k) => {
    if (ignore.includes(k)) return;
    const bv = before?.[k];
    const av = after?.[k];
    if (JSON.stringify(bv) !== JSON.stringify(av)) {
      changed[k] = { from: bv, to: av };
    }
  });
  return changed;
}
