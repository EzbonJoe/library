// Bulk-adding quotes in admin stamps every line in that paste with the same
// (or near-identical) created_at, so a pure recency sort clumps them
// together whenever a book gets a big batch added at once. This spreads a
// recency-ordered list out so consecutive cards rarely share a book, while
// still roughly preserving "newest first" (books are visited in the order
// their first quote appears in the input).
export function interleaveByBook<T extends { book: { slug: string } }>(items: T[]): T[] {
  const groups = new Map<string, T[]>();
  const order: string[] = [];

  for (const item of items) {
    const key = item.book.slug;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(item);
  }

  const result: T[] = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const key of order) {
      const group = groups.get(key)!;
      if (group.length > 0) {
        result.push(group.shift()!);
        remaining = true;
      }
    }
  }

  return result;
}
