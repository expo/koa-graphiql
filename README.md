# koa-graphiql

Koa middleware to display [GraphiQL](https://github.com/graphql/graphiql). Designed for Koa 2.

## Usage

```sh
npm i --save koa-graphiql
```

Add it to your Koa app. You may want to use router middleware if your app serves more than GraphiQL.

```js
import koaGraphiQL from 'koa-graphiql';

router.get('/graphiql', koaGraphiQL(async (ctx) => {
  return {
    url,        // String of the base URL of the GraphQL endpoint
    query,      // String to display in the query panel
    result,     // Object to display in the result panel
    variables,  // Object used to populate the "variables" panel
  };
}));
```
