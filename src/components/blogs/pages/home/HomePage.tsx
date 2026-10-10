import type { EncodeDataAttributeCallback } from "@sanity/react-loader";
import type { Image } from "sanity";
import type { HomePagePayload } from "../../../../../sanity/lib/sanity_types";
import { CustomPortableText } from "../../shared/CustomPortableText";
import ImageBox from "../../shared/ImageBox";
import { StoryCard, type JournalStory } from "../../journal/story-card";

export interface HomePageProps {
  data: HomePagePayload | null;
  data2: JournalStory[] | undefined;
  avatar: { _id?: string; name?: string; image?: Image }[] | undefined;
  trending: JournalStory[] | undefined;
  encodeDataAttribute?: EncodeDataAttributeCallback;
}

export function HomePage({
  data,
  data2,
  avatar,
  trending,
  encodeDataAttribute,
}: HomePageProps) {
  const curated = data?.showcaseProjects?.filter((story) => story.slug) || [];
  const stories = data2?.filter((story) => story.slug) || [];
  const featured = curated[0] || stories[0];
  const picks = (
    curated.length > 1
      ? curated.slice(1)
      : stories.filter((story) => story.slug !== featured?.slug)
  ).slice(0, 2);
  const popular = trending?.filter((story) => story.slug) || [];
  return (
    <div className="journal-home">
      <header className="journal-masthead">
        <span
          className="journal-kicker"
          data-sanity={encodeDataAttribute?.("title")}
        >
          {data?.title || "The academy journal"}
        </span>
        <h1>
          Stories from <em>the dojo.</em>
        </h1>
        <div className="journal-intro">
          {data?.overview?.length ? (
            <CustomPortableText value={data.overview} />
          ) : (
            <p>
              Training, competition, and the people behind Kaizen Karate
              Academy.
            </p>
          )}
        </div>
      </header>
      {featured && (
        <section className="journal-cover-grid" aria-label="Featured stories">
          <StoryCard
            story={featured}
            featured
            sanityAttribute={encodeDataAttribute?.([
              "showcaseProjects",
              0,
              "slug",
            ])}
          />
          <div className="journal-cover-side">
            {picks.map((story, index) => (
              <StoryCard
                key={story.slug}
                story={story}
                sanityAttribute={
                  curated.length > 1
                    ? encodeDataAttribute?.([
                        "showcaseProjects",
                        index + 1,
                        "slug",
                      ])
                    : undefined
                }
              />
            ))}
            {!picks.length && (
              <div className="journal-note">
                <span className="journal-kicker">Our philosophy</span>
                <h2>Progress, one practice at a time.</h2>
                <p>
                  A journal of discipline, community, and continuous
                  improvement.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
      <section className="journal-section" id="latest">
        <div className="journal-section-heading">
          <div>
            <span className="journal-kicker">On the record</span>
            <h2>
              The latest <em>stories.</em>
            </h2>
          </div>
          <p>News, perspectives, and moments from our academy.</p>
        </div>
        {stories.length ? (
          <div className="journal-story-grid">
            {stories.map((story) => (
              <StoryCard key={story._id || story.slug} story={story} />
            ))}
          </div>
        ) : (
          <div className="journal-note">
            <p>New stories will appear here as they are published.</p>
          </div>
        )}
      </section>
      {popular.length > 0 && (
        <section className="journal-section">
          <div className="journal-section-heading">
            <div>
              <span className="journal-kicker">In focus</span>
              <h2>
                Worth a <em>read.</em>
              </h2>
            </div>
          </div>
          <div className="journal-story-grid">
            {popular.slice(0, 3).map((story) => (
              <StoryCard key={story._id || story.slug} story={story} />
            ))}
          </div>
        </section>
      )}
      {!!avatar?.length && (
        <section className="journal-section journal-writers">
          <div className="journal-section-heading">
            <div>
              <span className="journal-kicker">Our community</span>
              <h2>
                Behind the <em>words.</em>
              </h2>
            </div>
            <p>Meet the people sharing our academy’s journey.</p>
          </div>
          <div className="journal-writer-grid">
            {avatar.map((writer, index) => (
              <div className="journal-writer" key={writer._id || index}>
                <ImageBox
                  image={writer.image}
                  alt={writer.name || "Academy writer"}
                  width={96}
                  height={96}
                  size="48px"
                  classesWrapper="relative aspect-square"
                />
                <div>
                  <span className="journal-label">Contributor</span>
                  <h3>{writer.name || "Academy contributor"}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
export default HomePage;
