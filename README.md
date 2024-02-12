# Multi tenancy sketches

This project is a synthetic test project for implementing multi tenancy.
Its a functional graphql api backend, that is easiest to access from the apollo graphql explorer.
The api and the explorer are available by default at `http://localhost:4000` by default,
after the app and its dependencies have been started

## Project setup

This project is using [`pnpm`](https://pnpm.io/) as its package manager.
To start the required databases or other dependencies, run `docker compose up -d`

## about Postgres setup

I had to change the `wal_level` on my local postgres instances
it is done with running the SQL command below, and restating the database server:

```sql
ALTER SYSTEM SET wal_level = logical;
```

## Using the api
