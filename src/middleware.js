/**
 * @flow
 */
type Options = {
  url: ?string;
  query: ?string;
  variables: ?Object;
  result?: Object;
};
type GetOptions = (ctx: Object) => Promise<Options>;

// Current latest version of GraphiQL
const GRAPHIQL_VERSION = '0.4.4';

export default function createMiddleware(getOptionsAsync: ?GetOptions) {
  return async function middleware(ctx) {
    let options = getDefaultOptions(ctx);
    if (getOptionsAsync) {
      Object.assign(options, await getOptionsAsync(ctx));
    }

    ctx.body = renderHtml(options);
    ctx.type = 'text/html';
  };
}

function getDefaultOptions(ctx) {
  let body = ctx.request.body || {};
  let query = body.query || ctx.query.query;

  let variables;
  let variablesString = body.variables || ctx.query.variables;
  try {
    variables = JSON.parse(variablesString);
  } catch (e) {}

  let result;
  let resultString = body.result || ctx.query.result;
  try {
    result = JSON.parse(resultString);
  } catch (e) {}

  return { query, variables, result };
}

/**
 * See express-graphql for the original implementation
 */
function renderHtml(options: Options): string {
  let url = options.url || '';
  let queryString = options.query;
  let variablesString = options.variables ?
    JSON.stringify(options.variables, null, 2) :
    null;
  let resultString = options.result ?
    JSON.stringify(options.result, null, 2) :
    null;

  // How to Meet Ladies
  return (
`<!DOCTYPE html>
<html>
<head>
  <link href="//cdn.jsdelivr.net/graphiql/${GRAPHIQL_VERSION}/graphiql.css" rel="stylesheet" />
  <script src="//cdn.jsdelivr.net/fetch/0.9.0/fetch.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/0.14.2/react.min.js"></script>
  <script src="//cdn.jsdelivr.net/react/0.14.2/react-dom.min.js"></script>
  <script src="//cdn.jsdelivr.net/graphiql/${GRAPHIQL_VERSION}/graphiql.min.js"></script>
</head>
<body>
  <script>
    // Collect the URL parameters
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });
    // Produce a Location query string from a parameter object.
    function locationQuery(params) {
      return '?' + Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }
    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };
    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }
    var fetchURL = ${JSON.stringify(url)} + locationQuery(otherParams);
    // Defines a GraphQL fetcher using the fetch API.
    function graphQLFetcher(graphQLParams) {
      return fetch(fetchURL, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function (response) {
        return response.json();
      });
    }
    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      updateURL();
    }
    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      updateURL();
    }
    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters));
    }
    // Render <GraphiQL /> into the body.
    React.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        query: ${JSON.stringify(queryString)},
        response: ${JSON.stringify(resultString)},
        variables: ${JSON.stringify(variablesString)}
      }),
      document.body
    );
  </script>
</body>
</html>`
  );
}
