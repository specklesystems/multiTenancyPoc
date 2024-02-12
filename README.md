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

## Project description

The app has these basic concepts:

### User

A user of the system (obviously). User authn is not implemented, authz is very simplified.

### Resource

This is an abstract object representing a project, that multiple users might work on.
The notion of work on is currently implemented as the comment create action.
A resource might belong to an organization or belong to the default (null) organization.

### Comment

A text note, that belongs to a given resource, created by a user.

### Region

A geo-located data storage region, currently implemented as a PostgresSQL database server.
When providing a connection url to a region, make sure to not include a database name or any trailing `/`-s in the url.

### Organization

A collection of users and an owner of resource. Any user may create organizations.
Organizations may be granted access to any given region. That action creates a new database in the region DB server. migrates it to the latest DB schema and sets up user and resource publish and subscribe mechanisms.

###
