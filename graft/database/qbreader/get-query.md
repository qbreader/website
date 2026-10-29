# database/qbreader/get-query.js

- escapeRegExp · function · L12-L14 — function escapeRegExp (string)
- getQuerySummary · function · L16-L29 — function getQuerySummary (options)
- validateOptions · function · L31-L103 — function validateOptions ({ queryString, difficulties, setName, searchType = 'all', questionType = 'all', categories, subcategories, alternateSubcategories, maxReturnLength = DEFAULT_QUERY_RETURN_LENGTH, randomize = false, regex = false, ignoreWordOrder = false, exactPhrase = false, caseSensitive = false, powermarkOnly = false, tossupPagination = 1, bonusPagination = 1, minYear, maxYear, verbose = false })
- getQuery · function · L126-L159 — async function getQuery (options = {})
- getTossupQuery · function · L161-L203 — async function getTossupQuery (options)
- getBonusQuery · function · L205-L248 — async function getBonusQuery (options)
- buildQueryAggregation · function · L250-L308 — function buildQueryAggregation ({ query, difficulties, categories, subcategories, alternateSubcategories, setName, maxReturnLength, randomize, minYear, maxYear, isEmpty, powermarkOnly, regex = false })
