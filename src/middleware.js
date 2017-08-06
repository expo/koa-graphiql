// @flow

type Options = {
  url: ?string,
  query: ?string,
  variables: ?Object,
  result?: Object,
  operationName: ?string
}
type GetOptions = (ctx: Object) => Promise<Options>

// Current latest version of GraphiQL.
const GRAPHIQL_VERSION = '0.11.2'

export default function createMiddleware (getOptionsAsync: ?GetOptions) {
  return async function middleware (ctx) {
    let options = getDefaultOptions(ctx)
    if (getOptionsAsync) {
      Object.assign(options, await getOptionsAsync(ctx))
    }

    ctx.body = renderHtml(options)
    ctx.type = 'text/html'
  }
}
// Ensures string values are safe to be used within a <script> tag.
function safeSerialize (data) {
  return data ? JSON.stringify(data).replace(/\//g, '\\/') : 'undefined'
}

function getDefaultOptions (ctx) {
  let body = ctx.request.body || {}
  let query = body.query || ctx.query.query

  let variables
  let variablesString = body.variables || ctx.query.variables
  try {
    variables = JSON.parse(variablesString)
  } catch (e) {}

  let result
  let resultString = body.result || ctx.query.result
  try {
    result = JSON.parse(resultString)
  } catch (e) {}

  return { query, variables, result }
}

/**
 * See express-graphql for the original implementation
 */
function renderHtml (options: Options): string {
  let url = options.url || ''
  let queryString = options.query
  let variablesString = options.variables
    ? JSON.stringify(options.variables, null, 2)
    : null
  let resultString = options.result
    ? JSON.stringify(options.result, null, 2)
    : null
  const operationName = options.operationName
  // How to Meet Ladies
  const cdnUrl = '//cdn.jsdelivr.net/'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphiQL</title>
  <meta name="robots" content="noindex" />
  <style>
    html, body {
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
    }
  </style>
  <link href="${cdnUrl}npm/graphiql@${GRAPHIQL_VERSION}/graphiql.css" rel="stylesheet" />
  <script src="${cdnUrl}fetch/0.9.0/fetch.min.js"></script>
  <script src="${cdnUrl}react/15.4.2/react.min.js"></script>
  <script src="${cdnUrl}react/15.4.2/react-dom.min.js"></script>
  <script src="${cdnUrl}npm/graphiql@${GRAPHIQL_VERSION}/graphiql.min.js"></script>
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
      return '?' + Object.keys(params).filter(function (key) {
        return Boolean(params[key]);
      }).map(function (key) {
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
        return response.text();
      }).then(function (responseBody) {
        try {
          return JSON.parse(responseBody);
        } catch (error) {
          return responseBody;
        }
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
    function onEditOperationName(newOperationName) {
      parameters.operationName = newOperationName;
      updateURL();
    }
    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters));
    }
    // Render <GraphiQL /> into the body.
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        query: ${safeSerialize(queryString)},
        response: ${safeSerialize(resultString)},
        variables: ${safeSerialize(variablesString)},
        operationName: ${safeSerialize(operationName)},
      }),
      document.body
    );
  </script>
</body>
</html>`
}
