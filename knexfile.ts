export const mainDBConfig = {
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    port: 5454,
    user: 'speckle',
    database: 'speckle_main',
    password: 'speckle'
  },
  migrations: {
    directory: 'src/migrations',
    extension: 'ts'
  }
}


export const euDBConfig = {
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    port: 5455,
    user: 'speckle',
    database: 'speckle_eu',
    password: 'speckle'
  },
  migrations: {
    directory: 'src/migrations',
    extension: 'ts'
  }
}

export const usDBConfig = {
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    port: 5456,
    user: 'speckle',
    database: 'speckle_us',
    password: 'speckle'
  },
  migrations: {
    directory: 'src/migrations',
    extension: 'ts'
  }
}
