//@ts-nocheck
import * as queryStore from "@sanity/react-loader";

import {
  homePageQuery,
  pagesBySlugQuery,
  projectBySlugQuery,
  settingsQuery,
  findTagQuery,
  findByCategoryQuery,
  findByAuthorQuery,
  allProjectSlugQuery,
} from "../lib/queries";
import { token } from "../lib/token";
import {
  HomePagePayload,
  PagePayload,
  ProjectPayload,
  SettingsPayload,
} from "../lib/sanity_types";

/**
 * Sets the server client for the query store, doing it here ensures that all data fetching in production
 * happens on the server and not on the client.
 * Live mode in `sanity/presentation` still works, as it uses the `useLiveMode` hook to update `useQuery` instances with
 * live draft content using `postMessage`.
 */

// Automatically handle draft mode
export const loadQuery: any = ((query, params = {}, options = {}) => {
  const { perspective = "published" } = options;
  // Don't cache by default
  let revalidate: NextFetchRequestConfig["revalidate"] = 0;
  // If `next.tags` is set, and we're not using the CDN, then it's safe to cache
  return queryStore.loadQuery(query, params, {
    ...options,
    next: {
      revalidate,
      ...(options.next || {}),
    },
    perspective,
    // @TODO add support in `@sanity/client/stega` for the below
    // stega: {enabled: draftMode().isEnabled}
  });
}) satisfies typeof queryStore.loadQuery;

/**
 * Loaders that are used in more than one place are declared here, otherwise they're colocated with the component
 */

export function loadAllProject(page: number, limit: number) {
  return loadQuery<any>(
    allProjectSlugQuery(page, limit), // Pass the page and limit parameters to the query
    {},
    { next: { tags: [`project`], revalidate: 18000 } },
  );
}

export function loadPage(slug: string) {
  return loadQuery<PagePayload | null>(
    pagesBySlugQuery,
    { slug },
    { next: { tags: [`page:${slug}`], revalidate: 18000 } },
  );
}

export function loadPostsByTag(tag: string) {
  return loadQuery<any>(
    findTagQuery(tag), // Use the double curly braces to reference the tag parameter
    //@ts-ignore
    { tag }, // Provide the tag parameter here
    { next: { tags: [`tag:${tag}`], revalidate: 18000 } },
  );
}

export function loadPostsByCategory(category: string) {
  return loadQuery<any>(
    findByCategoryQuery(category),
    { category },
    { next: { tags: [`category:${category}`], revalidate: 18000 } },
  );
}

export function loadPostsByAuthor(authorSlug: string) {
  return loadQuery<any>(
    findByAuthorQuery(authorSlug),
    {},
    { next: { tags: [`author:${authorSlug}`], revalidate: 18000 } },
  );
}
