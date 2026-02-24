import { WP_REST_BASE_URL } from "@/config/site";

export async function getPosts(limit?: string, page?: string, type?: string) {
  try {
    const queryParams = new URLSearchParams({
      _embed: "1",
    });

    if (limit) {
      queryParams.append("per_page", limit);
    }

    if (page) {
      queryParams.append("page", page);
    }

    const res = await fetch(`${WP_REST_BASE_URL}/${type}?${queryParams}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`WordPress API error: ${res.status} ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("WordPress API unreachable:", (error as Error).message);
    return [];
  }
}

export async function getPost(slug: string, type: string) {
  const postsData: Promise<Post[]> = getPosts("100", undefined, type);
  const posts = await postsData;
  const postArray = posts.filter((post) => post.slug == slug);
  const post = postArray.length > 0 ? postArray[0] : null;
  return post;
}

export async function getPostsSearchResults(searchTerm: string) {
  try {
    const res = await fetch(
      `${WP_REST_BASE_URL}/posts?search=${searchTerm}&_embed`,
    );

    if (!res.ok) {
      console.error(`WordPress API error: ${res.status} ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("WordPress API unreachable:", (error as Error).message);
    return [];
  }
}

export async function getProjectsSearchResults(searchTerm: string) {
  try {
    const res = await fetch(
      `${WP_REST_BASE_URL}/projects?search=${searchTerm}&_embed`,
    );

    if (!res.ok) {
      console.error(`WordPress API error: ${res.status} ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("WordPress API unreachable:", (error as Error).message);
    return [];
  }
}
