import "./BlogLoader.scss";
export default function BlogLoader() {
  return (
    <div id="w-full pt-60 h-[400px]">
      <div
        className="divider font-extralight tracking-tighter"
        aria-hidden="true"
      ></div>
      <p className="loading-text" aria-label="Loading">
        <span className="letter" aria-hidden="true">
          H
        </span>
        <span className="letter" aria-hidden="true">
          k
        </span>
        <span className="letter" aria-hidden="true">
          d
        </span>
        <span className="letter" aria-hidden="true">
          b
        </span>
        <span className="letter" aria-hidden="true">
          l
        </span>
        <span className="letter" aria-hidden="true">
          o
        </span>
        <span className="letter" aria-hidden="true">
          g
        </span>
      </p>
    </div>
  );
}
