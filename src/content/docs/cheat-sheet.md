---
title: "Cheat sheet"
description: "Every everyday call on one page"
group: start
order: 2
source: README.md
---

An Eloquent-style ORM for Rust, targeting **MySQL 8.4+** and **Oracle 19c+**. One API, two SQL dialects. Async, on tokio.

The pages follow the layout of the Laravel Eloquent docs, so if you know Laravel you will know where to look.

## Cheat sheet

For people in a hurry and for coding agents. Every terminal method is `async` and takes `&impl Executor` (a `&Db` or a `&Transaction`) as its first argument.

```rust
use rustique::prelude::*;
use chrono::NaiveDateTime;

#[rustique::model(table = "users", timestamps, soft_deletes)]
#[derive(Debug, Clone, Default)]
pub struct User {
    pub id: i64,                       // `id` is the primary key unless a field has #[rustique(primary_key)]
    pub name: String,
    pub email: String,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    #[rustique(has_many(Post))]
    pub posts: Rel<Vec<Post>>,
}

let db = Db::connect("mysql://user:pass@localhost/app").await?;

let user = User::find(&db, 1).await?;                 // Option<User>
let user = User::find_or_fail(&db, 1).await?;         // Err(Error::NotFound) when missing
let users = User::query()
    .where_(User::EMAIL, "like", "%@example.com")
    .order_by_desc(User::ID)
    .with("posts.comments")                            // eager load, one query per level
    .get(&db).await?;                                  // Collection<User>

let mut user = User::create(&db, User { name: "Ann".into(), email: "a@x.io".into(), ..Default::default() }).await?;
user.name = "Anne".into();
user.save(&db).await?;                                 // UPDATE of dirty columns only
user.delete(&db).await?;                               // soft delete (sets deleted_at)

let posts = user.posts().where_("published", "=", true).get(&db).await?; // lazy relation query
let users = User::query().with_where("posts", |q| q.where_("published", "=", true)).get(&db).await?;
let users = User::query().with("posts:id,title").get(&db).await?;   // only those columns of posts
let posts = Post::query().order_by(rustique::col!("posts.id")).get(&db).await?; // checked with `schema-check`
let page = User::query().cursor_paginate(&db, 50, None).await?;  // page.next_cursor for the next one
let ann = User::first_or_create(&db, vec![(User::EMAIL, "a@x.io".into())], vec![]).await?;
for post in user.posts.loaded()? { /* after with("posts") or user.load(&db, "posts") */ }
let rows = db.select(rustique::sql!("SELECT id FROM users WHERE id > ?"), [10.into()]).await?; // raw SQL, checked with `schema-check`

let tx = db.begin().await?;
user.force_delete(&tx).await?;
tx.commit().await?;                                    // dropped without commit = rollback
```

Rules worth knowing before you write code:

1. Build models with `..Default::default()`. The macro adds a hidden `__meta` field.
2. Relations never load on field access. Use `with(...)`, `model.load(&db, "rel")`, or the lazy `model.rel()` query.
3. Column constants exist for every column: `User::EMAIL == "email"`. Plain strings work too.
4. Hooks and observers run on model methods (`save`, `delete`, ...), never on bulk query methods (`Query::update`, `Query::delete`, `Model::upsert`).
5. Oracle identifiers are uppercased and quoted. Write lowercase names in Rust.
6. Turn on `rustique::prevent_lazy_loading(rustique::LazyLoading::Deny)` in development to catch N+1 loops.
7. Timestamps are UTC unless `rustique::set_timezone(...)` sets the application time zone (Laravel's `app.timezone`) at startup.
8. Schema changes: edit `rustique-schema.txt` (written by `schema:snapshot`), then `make:migration <name> --diff` writes the migration from the database to it ([details](/docs/migrations/#migrations-from-a-schema-diff)).
9. With the `schema-check` feature, models, relation keys, `col!("t.c")`, `sql!("...")` and `"t.c"` strings in scopes are checked against `rustique-schema.txt` at compile time; `schema = "billing"` (on models, scopes, `col!`, `sql!`) reads `rustique-schema.billing.txt`. See [the schema check](/docs/migrations/#compile-time-schema-check).
