# koa-graphiql

Koa middleware to display [GraphiQL](https://github.com/graphql/graphiql). Designed for Koa 2.

## Usage

```sh
npm i --save koa-graphiql
```

Add it to your Koa app. You may want to use router middleware if your app serves more than GraphiQL.

```js
import graphiql from 'koa-graphiql';

router.get('/graphiql', graphiql(async (ctx) => {
  return {
    // String of the base URL of the GraphQL endpoint
    url: '/graphql',

    // String to display in the query panel
    query: 'query Demo($token: String) { viewer(token: $token) { id } }',

    // Object to display in the result panel
    result: {
      data: {
        viewer: { id: 'account[ide]' }
      }
    },

    // Object used to populate the "variables" panel
    variables: {
      token: 'eyJhbGciOiJIUzI1NiJ9.YWNjb3VudFtpZGVd.-w3FiHaq5jIFIOzHErgdEQGvXXG6wClBUDFDVgwUyx8'
    },
  };
}));
```
