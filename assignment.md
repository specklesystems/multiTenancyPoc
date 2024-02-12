# Technical assignment

The multi tenant application found in this repository is a striped down but functional example of what we need from our production system.
The current state of this application has some shortcomings, that stops us from choosing this data storage architecture:

- with each organization living in its own database in a specific database server, we need to replicate all user data into each organization specific database.
  We do not need to sync all users into all organization's dbs, just the users, who are part of a given organization
- each organization has to publish their resource data into the main database and the main database has to subscribe to them.
  In the long run the number of active subscriptions in the main database scales 1:1 with the number of organizations, which is not ideal.
- Each organization may have access to multiple regions. Each organization's region currently means 1 `knex` database connection client with a connection pool.
  In a production workload, the connection pool would use 10+ connections. We'd run multiple instances (~ 10 pods) of the back-end server.
  Given a 100 organizations, having access to 3 regions each, the number of active connections that are targeting each database server becomes huge. This is not scalable.
- Each organizations database connection's are now kept in an in memory map, that can result storing a lot not used clients in memory.
  How can we optimize for efficient but relatively fast client access?
