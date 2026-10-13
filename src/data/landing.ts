// Landing page data and logic, copied from the design's <script type="text/x-dc"> (design/Main.dc.html).
// Imported both at build time (initial render) and by the client scripts (toggles).

export const INSTALL = 'cargo add rustique-orm';

export const SQL = {
  mysql: 'SELECT * FROM `users` WHERE `name` = ? AND `users`.`deleted_at` IS NULL ORDER BY `id` DESC LIMIT 10',
  oracle: 'SELECT * FROM "USERS" WHERE "NAME" = :1 AND "USERS"."DELETED_AT" IS NULL ORDER BY "ID" DESC FETCH NEXT 10 ROWS ONLY',
};

// [concern, MySQL, Oracle]
export const diffRows: [string, string, string][] = [
  ['Identifiers', '`users`.`email`', '"USERS"."EMAIL"'],
  ['Placeholders', '?', ':1, :2, …'],
  ['Limit / offset', 'LIMIT n OFFSET m', 'OFFSET m ROWS FETCH NEXT n ROWS ONLY'],
  ['Generated key', 'last_insert_id()', 'RETURNING … INTO'],
  ['Upsert', 'INSERT … ON DUPLICATE KEY UPDATE', 'MERGE'],
  ['JSON column', 'JSON', 'CLOB with IS JSON check'],
];

type BenchRow = [name: string, label: string, rustique: number, eloquent: number, unit: string];

export const mysqlRows: BenchRow[] = [
  ['find_by_pk', 'Find one model by key', 136, 279, 'µs'],
  ['insert_single', 'Insert one row', 1.1, 1.3, 'ms'],
  ['update_single', 'Save dirty columns', 1.1, 1.4, 'ms'],
  ['fetch_10000_rows', 'Hydrate 10,000 models', 21.3, 44.7, 'ms'],
  ['eager_1000_users', '1,000 users with 10,000 posts', 31.5, 81.8, 'ms'],
  ['bulk_insert_10000', 'Insert 10,000 rows', 86.0, 152.2, 'ms'],
];

export const oracleRows: BenchRow[] = [
  ['find_by_pk', 'Find one model by key', 192, 230, 'µs'],
  ['insert_single', 'Insert one row', 601, 652, 'µs'],
  ['update_single', 'Save dirty columns', 554, 650, 'µs'],
  ['fetch_10000_rows', 'Hydrate 10,000 models', 29.8, 83.8, 'ms'],
  ['eager_1000_users', '1,000 users with 10,000 posts', 48.9, 2693.0, 'ms'],
  ['bulk_insert_10000', 'Insert 10,000 rows', 1219.2, 7211.0, 'ms'],
];

const fmt = (v: number, u: string) =>
  v.toLocaleString('en-US', { minimumFractionDigits: v < 100 && u === 'ms' ? 1 : 0, maximumFractionDigits: 1 }) + ' ' + u;

export const benchRows = (db: 'mysql' | 'oracle') =>
  (db === 'mysql' ? mysqlRows : oracleRows).map((r) => ({
    name: r[0],
    label: r[1],
    r: fmt(r[2], r[4]),
    e: fmt(r[3], r[4]),
    rw: Math.max(0.6, (r[2] / r[3]) * 100).toFixed(2) + '%',
    factor: (r[3] / r[2]).toFixed(1) + '× faster',
  }));

export type Features = { mysql: boolean; tls: boolean; oracle: boolean; schema: boolean };
export type FeatureKey = keyof Features;

export const defaultFeatures: Features = { mysql: true, tls: true, oracle: true, schema: false };

// [state key, bit index, cargo feature, description], most significant bit first.
export const featureDefs: [FeatureKey, number, string, string][] = [
  ['schema', 3, 'schema-check', 'Check model structs against a schema snapshot at compile time'],
  ['oracle', 2, 'oracle', 'Oracle 19c+ driver'],
  ['tls', 1, 'mysql-tls', 'TLS through rustls'],
  ['mysql', 0, 'mysql', 'MySQL 8.4+, pure Rust driver'],
];

// mysql-tls implies mysql; dropping mysql drops mysql-tls.
export function toggleFeature(f: Features, k: FeatureKey): Features {
  const n = { ...f, [k]: !f[k] };
  if (k === 'tls' && n.tls) n.mysql = true;
  if (k === 'mysql' && !n.mysql) n.tls = false;
  return n;
}

export function cargo(f: Features) {
  const list: string[] = [];
  if (f.mysql) list.push('"mysql"');
  if (f.tls) list.push('"mysql-tls"');
  if (f.oracle) list.push('"oracle"');
  if (f.schema) list.push('"schema-check"');
  const isDefault = f.mysql && f.tls && f.oracle;
  let line: string;
  if (isDefault && !f.schema) line = 'rustique-orm = "0.2"';
  else if (isDefault) line = 'rustique-orm = { version = "0.2", features = ["schema-check"] }';
  else line = 'rustique-orm = { version = "0.2", default-features = false, features = [' + list.join(', ') + '] }';
  let note = 'The oracle feature needs Oracle Instant Client at runtime only, not to build.';
  if (!f.mysql && !f.oracle) note = 'Pick at least one database driver.';
  else if (!f.oracle) note = 'Pure Rust from driver to TLS: no C client to install.';
  const binary = '0b' + featureDefs.map((d) => (f[d[0]] ? '1' : '0')).join('');
  const text = '[dependencies]\n' + line + '\ntokio = { version = "1", features = ["macros", "rt-multi-thread"] }\nchrono = "0.4"\n';
  return { line, note, binary, text };
}

// "The rest of the surface" rows: [offset, name, tag, tag background, description, docs slug].
export const surface: [string, string, string, string, string, string][] = [
  ['+0x00', 'models', 'Model', '#FF7448', 'Dirty tracking, timestamps, soft deletes, UUID and ULID keys, mass assignment.', 'models'],
  ['+0x08', 'query', 'QueryBuilder', '#8DA2FF', 'Wheres on dates, JSON and subqueries, joins, unions, aggregates, upsert, bulk insert.', 'query-builder'],
  ['+0x10', 'relations', 'Rel<T>', '#38D39F', 'has_one to morph_to_many, eager loading, with_count, where_has, pivots.', 'relationships'],
  ['+0x18', 'schema', 'Migrator', '#FFC53D', 'Schema::create, Blueprint, fresh, reset and --step, seeders and a ready CLI.', 'migrations'],
  ['+0x20', 'events', 'Scopes + hooks', '#FF7448', 'Local and global scopes, creating, saved and deleting hooks, observers.', 'events'],
  ['+0x28', 'pages', 'Paginator', '#8DA2FF', 'paginate, simple_paginate, cursor_paginate, chunk, chunk_by_id and streaming cursors.', 'large-results'],
  ['+0x30', 'factories', 'Factory', '#38D39F', 'User::factory().count(10).create(&db) for tests and seeders.', 'factories'],
  ['+0x38', 'casts', 'Cast', '#FFC53D', '#[derive(rustique::Cast)] maps JSON and your own types to columns.', 'casts'],
  ['+0x40', 'safety', 'forbid(unsafe)', '#10161F', 'N+1 detection, deadlock retries, savepoints, query logging through tracing.', 'database'],
];

// Mobile struct table rows (design comment in the rig-m block): [offset, field, type, type color, value, value bg, animation].
export const structRows: [string, string, string, string, string, string, string][] = [
  ['+0x00', 'id', 'i64', '#C2401A', '1', '#FF7448', 'v0'],
  ['+0x08', 'name', 'String', '#3050D8', '"Ann"', '#8DA2FF', 'v1'],
  ['+0x20', 'email', 'String', '#3050D8', '"ann@example.com"', '#8DA2FF', 'v2'],
  ['+0x38', 'created_at', 'Option<NaiveDT>', '#8A5A00', 'Some(2026-10-13)', '#FFC53D', 'v3'],
  ['+0x44', 'updated_at', 'Option<NaiveDT>', '#8A5A00', 'Some(2026-10-13)', '#FFC53D', 'v4'],
  ['+0x50', 'deleted_at', 'Option<NaiveDT>', '#8A5A00', 'None', '#FFC53D', 'v5'],
];
