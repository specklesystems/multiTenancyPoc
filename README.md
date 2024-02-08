# about postgres

i had to change the `wal_level` on my local postgres instances
done with 
```
ALTER SYSTEM SET wal_level = logical;
```