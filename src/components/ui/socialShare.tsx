"use client";
import { useEffect, useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
export default function SocialShare() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(window.location.href);
  }, []);
  async function copyLink() {
    const link = window.location.href;
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(link);
      else {
        const input = document.createElement("textarea");
        input.value = link;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("Copy failed");
      }
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error(
        "Could not copy the link. Please copy it from your address bar.",
      );
    }
  }
  async function share() {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        toast.error("Could not share this story.");
    }
  }
  const encoded = encodeURIComponent(url);
  return (
    <div className="journal-share">
      <span className="journal-label">Share this story</span>
      <div className="journal-share-actions">
        {[
          {
            name: "Facebook",
            href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
          },
          {
            name: "X",
            href: `https://twitter.com/intent/tweet?url=${encoded}`,
          },
          {
            name: "WhatsApp",
            href: `https://api.whatsapp.com/send?text=${encoded}`,
          },
          { name: "Telegram", href: `https://t.me/share/url?url=${encoded}` },
        ].map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="journal-share-link"
          >
            {item.name}
          </a>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={copyLink}
          className="gap-2 rounded-full"
        >
          <Copy size={14} aria-hidden="true" /> Copy link
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={share}
          aria-label="Share this story"
          className="h-9 w-9 rounded-full"
        >
          <Share2 size={16} />
        </Button>
      </div>
    </div>
  );
}
