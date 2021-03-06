import Rx from '../../platform/lib/rxjs';

// operators
import Enricher from '../operators/enricher';


// mixers
import contextSearch from '../mixers/context-search';
import deduplicate from '../mixers/deduplicate';
import enrich from '../mixers/enrich';
import searchOnEmpty from '../mixers/search-on-empty';
import updateIncompleteResults from '../mixers/update-incomplete-results';

/*
 * Constructs a result stream by mixing results from multiple providers
 * for the given query string.
 */
const mixResults = (query, providers, enricher = new Enricher(), config) => {
  // TODO: also dedup within history results
  const history$ = providers.history.search(query, config);
  const cliqz$ = providers.cliqz.search(query, config).share();
  // fetch rich header promises
  const cliqzUpdated$ =
    updateIncompleteResults(query, providers.richHeader, cliqz$, config);
  // TODO: deduplicate
  const instant$ = providers.instant.search(query, config);
  const calculator$ = providers.calculator.search(query, config);
  // add search suggestions if no other results
  const suggestions$ = searchOnEmpty(query, providers.querySuggestions, cliqzUpdated$, config);

  // contextSearch (if enabled) makes a second call to the backend
  const cliqzExpanded$ = contextSearch(query, providers.cliqz, cliqzUpdated$, config);
  // TODO: update 'kind' of history results that also occured in backend
  const cliqzDeduplicated$ = deduplicate(cliqzExpanded$, history$);
  // TODO: how to update 'kind' for enriched history results?
  const historyEnriched$ = enrich(enricher, history$, cliqzExpanded$);

  const mixed$ = Rx.Observable
    // TODO: throttle? mixes everytime one of the providers return
    .combineLatest(
      instant$,
      historyEnriched$,
      calculator$, // Place the calculator result below history for now
      cliqzDeduplicated$,
      suggestions$,
    );
  return mixed$;
};

export default mixResults;
